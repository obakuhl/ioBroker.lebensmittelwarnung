'use strict';

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const adapterName = require('./package.json').name.split('.').pop();
const parseString = require('xml2js').parseString;
//var parser = new xml2js.Parser();
const https = require('https');
const fs = require('fs');
const eyes = require('eyes');

/**
 * The adapter instance
 * @type {ioBroker.Adapter}
 */
let adapter;

const objectsInitialized = {};

//let foodJSONDP = '0_userdata.0.Lebensmittel.Warnung.json'
//let foodHTMLDP = '0_userdata.0.Lebensmittel.Warnung.html'
//let selectedCountryDP = '0_userdata.0.Lebensmittel.Warnung.country'

let contact = 'https://www.lebensmittelwarnung.de/DE/Service/Kontakt/kontakt_node.html'
let foodWarningRSS =  'https://www.lebensmittelwarnung.de/___LMW-Redaktion/RSSNewsfeed/Functions/RssFeeds/rssnewsfeed_Alle_DE.xml'
// 'https://www.lebensmittelwarnung.de/bvl-lmw-de/opensaga/feed/alle/alle_bundeslaender.rss'
let maxEntries = 20;

/**
 * Starts the adapter instance
 * @param {Partial<utils.AdapterOptions>} [options]
 */
function startAdapter(options) {
	options = options || {};
	
	Object.assign(options, {
        name: adapterName,
        unload: callback => {
            try {
				callback();                
            } catch (e) {
                callback();
            }
        },
        ready: () => main(),
        message: msg => processMessage(msg),
    });
	
	adapter = new utils.Adapter(options);
	return adapter;
}

function main() {
	adapter.setState('info.connection', false, true);
	
	/*(async() => {
        try {
			adapter.log.debug(`hello`);		
			await handleRequest();
        } catch (err) {
			adapter.log.info(`Could not process request: ${err}`);
			return;
            }
	})();*/
	
	getData();

	/*if(existsState(foodJSONDP)){
	    getData()
	} else{
	    setTimeout(function(){
	        getData()
	    },3000);
	}

	schedule('* /30 * * * *', () => { // * und / ohne leerzeichen
	    getData();
	});
	
	on({id: selectedCountryDP, change: "any"}, function (obj) {
	    let value = obj.state.val;
	    getData()
	});
	on({id: foodJSONDP, change: "any"}, function (obj) {
	    let value = obj.state.val;
	    setHTML(value)
	});*/
	

}

function setHTML(data){
    let html = ''
    let items = JSON.parse(data)
    html += '<html><table style="width:100%; overflow:scroll;border-collapse: collapse; border: 2px solid black;">'
    html += '<thead><tr>'
    html += '<td style="border: 1px solid black;">Veröffentlicht</td>'
    html += '<td style="border: 1px solid black;">Bild</td>'
    html += '<td style="border: 1px solid black;">Titel</td>'
    html += '<td style="border: 1px solid black;">Grund</td>'
    html += '<td style="border: 1px solid black;">Hersteller</td>'
    html += '</tr></thead>'
    for(let i=0;i<items.length;i++){
        html += '<tr style="border: 1px solid black;">';
        
        html += '<td style="width:15%;border: 1px solid black;">';
        html += formatDate(items[i].pubDateTS,'DD.MM.YYYY hh:mm')
        html += '</td>'

        html += '<td style="text-align:center; width:20%;border: 1px solid black;">';
        html += items[i].picture
        html += '</td>'

        html += '<td style="width:20%;border: 1px solid black;">';
        html += items[i].title
        html += '</td>'

        html += '<td style="width:20%;border: 1px solid black;">';
        html += items[i].reason
        html += '</td>'

        html += '<td style="width:10%;border: 1px solid black;">';
        html += items[i].manufacturer
        html += '</td>'

        html += '</tr>'            
    }
    html += '</table><html>'
    setState(foodHTMLDP,html)
}

function getData(){
    //let parseString = require('xml2js').parseString;
    let jsonCount = 0;    
    https.get(foodWarningRSS, function (error, response) {
        if (!error && response.statusCode == 200) {
			adapter.log.debug(`wir sind in getData`);
			
            parseString(response.data, {
                explicitArray: false,
                mergeAttrs: true
            },
            function (err, result) {
                adapter.log.debug(`${JSON.stringify(result, null, 2)}`);
				
                if (err) {
                    adapter.log.debug("Fehler: " + err, 'error');
                } else {    
                    //var tabelle;
                    let jsonWarning =[];
                        // Titel links, Inhalt rechts
                        adapter.log.debug(`${result.rss.channel}`);
                    
                    for (var i = 0; i <result.rss.channel.item.length; i++) {
                        let item =result.rss.channel.item[i];
                        let itemObj = {}
                        // title, link, description (img src), 
                        itemObj.pubDate = result.rss.channel.item[i].pubDate;
                        itemObj.pubDateTS = new Date(itemObj.pubDate).getTime()
                        //itemObj.guid = result.rss.channel.item[i].guid;
                        let link = result.rss.channel.item[i].link;
                        itemObj.title = result.rss.channel.item[i].title;
                        https.get(link, function (error, response) {
                            adapter.log.debug(response.data)
                            let item = response.data;
                            //const html2json = require('html2json').html2json;
                            //let itemJson = html2json(item);
                            adapter.log.debug(JSON.stringify(itemJson.child[0].child[3].child[1].child))
                            // html
                            
                            let pos = item.indexOf('lmw-section__head')
                            let href = item.indexOf('href="',pos+1)+6
                            let hrefEnd = item.indexOf('"',href+6)
                            
                            itemObj.picture = '<a href="'+link+'">'+'<img src="https://www.lebensmittelwarnung.de' + item.substring(href, hrefEnd) + '" style="max-width: 250px; width: auto; height: 100px; " ></a>' //overflow: "scroll" max-width="200px!important" width="auto" height="150px"
                        
                            let first = item.indexOf('lmw-description-list__item--product-name',hrefEnd)
                            
                            first = item.indexOf('<p>',first)+3
                            let end = item.indexOf('</p>',first+3)
                            itemObj.description = item.substring(first, end);
                            
                            first = item.indexOf('lmw-description-list__item--production-date',end)
                            if(first>=0){
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.productDate = item.substring(first, end);
                            }
                            first = item.indexOf('lmw-description-list__item--durability',end)
                            if(first>=0){
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.productDurability = item.substring(first, end);
                            }
                            first = item.indexOf('lmw-description-list__item--packaging-unit',end);
                            if(first>=0){
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.packingUnit = item.substring(first, end);
                            }
                            first = item.indexOf('lmw-description-list__item--batch-number',end);
                            if(first>=0){
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.chargeNumber = item.substring(first, end);
                            //jsonWarning.push(itemObj)
                            }
                            first = item.indexOf('lmw-description-list__item--further-marking',end);
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.extDescription = item.substring(first, end);

                            first = item.indexOf('lmw-description-list__item--manufacturer',end)
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.manufacturer = item.substring(first, end);

                            end = item.indexOf('lmw-section__content',end)
                            first = item.indexOf('lmw-section-toggle-panel-ID-1',end);
                            first = item.indexOf('<span',first)+5
                            first = item.indexOf('>',first+5)+1
                            end = item.indexOf('</span>',first+1)
                            itemObj.reason = item.substring(first, end);

                            first = item.indexOf('lmw-description-list__description',end)
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.information = item.substring(first, end);


                            first = item.indexOf('lmw-section-toggle-head-ID-2',end)
                            first = item.indexOf('<ul',first)+3
                            end = item.indexOf('</ul>',first+3)
                            adapter.log.debug(item.substring(first, end))
                            let ul = item.substring(first, end)
                            /*
                            ul = ul.replace('<li class="lmw-list__item">','')
                            ul = ul.replace('<span class="lmw-badge lmw-badge--dark lmw-badge--large">','')
                            ul = ul.replace('</li>','')
                            ul = ul.replace('<ul class="lmw-list lmw-list--badges">','')
                            console.log(ul);
                            */
                            const regex = /<li class="lmw-list__item">\s*<span class="lmw-badge lmw-badge--dark lmw-badge--large">([^<]+)<\/span>\s*<\/li>/g;
                            let matches;
                            let result = [];

                            while ((matches = regex.exec(ul)) !== null) {
                                result.push(matches[1]);
                            }
                            itemObj.listCountries = result;
                            //const textContent = result.join(', ');
                            adapter.log.debug(textContent);
                            /*
                            first = item.indexOf('lmw-description-list__description',end)
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.distribution = item.substring(first, end);

                            first = item.indexOf('lmw-section--spring-wod',end);
                            first = item.indexOf('<p>',first)+3
                            end = item.indexOf('</p>',first+3)
                            itemObj.distribution2 = item.substring(first, end);
                            */
                            let selectedCountry = adapter.config.federal_states;

                            if(selectedCountry == '' || (selectedCountry != '' && result.includes(selectedCountry))) {
                                jsonWarning.push(itemObj)
                                
                            }
                        })
                        
                        if(i >= maxEntries-1){
                            break;
                        }
                    }
                    setTimeout(function(){
                        let sortAscending = false;
                        jsonWarning.sort((a, b) => sortAscending ? a.pubDateTS - b.pubDateTS : b.pubDateTS - a.pubDateTS);

                        setState(foodJSONDP, JSON.stringify(jsonWarning));
                    },1000);
                }
            });
        } else  {
            adapter.log.debug(error, 'error');
        }
    });   // Ende request 
}

async function handleRequest() {
    // create states
    if (!objectsInitialized) {
	await createObjects();
	objectsInitialized = true;
    }
}

async function createObjects() {
    // create all Objects
    adapter.log.debug(`Creating objects`);
    await adapter.extendObjectAsync(user, {
	type: 'state',
	common: {name: 'warnings', role: 'state', type: 'boolean'}, //why boolean, it is a folder
	native: {name: 'warnings'}
    });

    let obj = {
        type: 'string',
        common: {name: 'Lebensmittel-Warnungen JSON', read: true, write: false, role: 'text', type: 'string'},
        native: {name: 'Lebensmittel-Warnungen JSON'}
    };
    await adapter.extendObjectAsync(`foodJSONDP`, obj);
    obj = {
        type: 'string',
        common: {name: 'Lebensmittel-Warnungen HTML', read: true, write: false, role: 'text', type: 'string'},
        native: {name: 'Lebensmittel-Warnungen HTML'}
    };
    await adapter.extendObjectAsync(`foodHTMLDP`, obj);	

//createStateAsync(selectedCountryDP, {read: true, write: true, name: 'Gewähltes Land' , type: "string", role: "text", def: "", states: {}}); 

}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
