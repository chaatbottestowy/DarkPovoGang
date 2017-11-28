var TelegramBot = require('node-telegram-bot-api'),
		telegram = new TelegramBot("483774152:AAFNnHRXFF_LHCQGm7fRpWDspwMMPVcPRA0", { polling: true });
const express = require('express');
const path = require("path");
const request = require('request');
const cors = require('cors');
const fetch = require("node-fetch");
const mapper = require('./server/server.js');
const svg2png=require('svg2png');
const unirest=require('unirest');
const q=require('q');


var povo1p1 = '/img/Povo1P1.svg';
var povo1pt = '/img/Povo1PT.svg';
var povo2p1 = '/img/Povo2P1.svg';
var povo2pt = '/img/Povo2PT.svg';
var photo = 'photo_2017-10-12_10-39-45.jpg';

function getData(sede){
	let rooms = [];
	let now = new Date();
	let day = now.getDate();
	let month = now.getMonth() + 1;
	let year = now.getFullYear();
	let currentTimestamp = now.getTime() / 1000;
	url = "https://easyroom.unitn.it/Orario/rooms_call.php?form-type=rooms&sede="+sede+"&_lang=it&date=" + day + "-" + month + "-" + year;
	return fetch(url)
	.then(body => {
			return body.json();
	})
	.then(data => {
			return data.events;
	})
	.then(events => {
			console.log("SECONDO .then");
			rooms = mapper.getRoomList(events); 
			rooms = mapper.cleanSchedule(rooms);    
			rooms = mapper.getFreeRooms(rooms, currentTimestamp);
			rooms = mapper.cleanPastSchedule(rooms, currentTimestamp);
			return rooms;
	})
	.catch(error => {
			console.log("Errore nel parsing json: "+error);
	});
}

function getDataAndMaps(sede, id){

	let rooms = [];
	let now = new Date();
	let day = now.getDate();
	let month = now.getMonth() + 1;
	let year = now.getFullYear();
	let currentTimestamp = now.getTime() / 1000;
	var sourceBuffer;
	url = "https://easyroom.unitn.it/Orario/rooms_call.php?form-type=rooms&sede="+sede+"&_lang=it&date=" + day + "-" + month + "-" + year;

	return fetch(url)
	.then(body => {
			return body.json();
	})
	.then(data => {
			return data.events;
	})
	.then(events => {
			console.log("SECONDO .then");
			rooms = mapper.getRoomList(events); 
			rooms = mapper.cleanSchedule(rooms);    
			rooms = mapper.getFreeRooms(rooms, currentTimestamp);
			rooms = mapper.cleanPastSchedule(rooms, currentTimestamp);
			//console.log(rooms);
			return rooms;
	})
	.then(rooms => {
		var maps = mapper.getMaps(rooms,sede);
		//console.log(maps);
		return maps;
	})
	.then(maps => {
		var sourceBuffer;
  	  	svg2png(maps)
    	.then(function (buffer) {
    		//console.log("convertito!");
        	//sourceBuffer = new Buffer(buffer, 'base64');
        	//console.log(sourceBuffer); 
        	telegram.sendPhoto(id,buffer);       
    	})
    	.catch(function (error) {
        	console.log("Conversion Error! "+error);
    	});
    	//console.log(sourceBuffer);
	})
	.catch(error => {
			console.log("Errore nel parsing json: "+error);
	});
}

function Print(sede,chatid){
		let message = "ciao";
        let msg = "";
		//var maps = getDataAndMaps(sede, chatid);
		let rooms = getData(sede).then(rooms => {
			for(let i = 0; i < rooms.length; i++){
				for(let j = 0; j < rooms[i].orario.length; j++){
					msg += rooms[i].NomeAula+" libera fino alle "+rooms[i].orario[j].from+"\n";
				    message = msg;
                }
			}
            if(message.includes("ciao"))
            {
                message = "l'uni è chiusa, sta a casa!";
                telegram.sendMessage(chatid, message);
            }
            else
            {    
                telegram.sendMessage(chatid, message);	
            }
		});
    
}


telegram.on("text", (message) => {
	if (message.text == "/start")
	{
		telegram.sendMessage(message.chat.id, "Ciao! Grazie a questo bot puoi sapere le aule di Unitn libere del dipartimento che vuoi! Digita /help per sapere i comandi disponibili.", {parse_mode: "Markdown"});
	}
	else if (message.text == "/help")
	{
		telegram.sendMessage(message.chat.id, "I comandi disponibili sono: \n/help \n/start \n/povo \n/socio \n/economia \n/scicogn \n/lettere \n/giuri \n/mesiano \n/filosofia"); 
	}
	else if (message.text.toLowerCase().includes("povo"))Print("E0503",message.chat.id);
	else if (message.text.toLowerCase().includes("ingegneria") || message.text.toLowerCase().includes("mesiano"))Print("E0301",message.chat.id);
	else if (message.text.toLowerCase().includes("giurisprudenza") || message.text.toLowerCase().includes("giuri"))Print("E0201",message.chat.id);
	else if (message.text.toLowerCase().includes("sociologia") || message.text.toLowerCase().includes("socio"))Print("E0601",message.chat.id);
	else if (message.text.toLowerCase().includes("filosofia") || message.text.toLowerCase().includes("lettere"))Print("E0801",message.chat.id);
	else if (message.text.toLowerCase().includes("scienze cognitive") || message.text.toLowerCase().includes("scicogn"))Print("E0705",message.chat.id);
	else if (message.text.toLowerCase().includes("economia"))Print("E0101",message.chat.id);

	else
    {
		telegram.sendMessage(message.chat.id,"Comando non riconosciuto! Digita /help per conoscere la lista dei comandi.")
	}
});