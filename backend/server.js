import express from 'express';
import path from 'path';
import { connect } from '../db/connect.js';
import { play } from './player.js';


const db = await connect();
let tracks = await loadTracks();
const currentTracks = new Map(); // maps partyCode to index in tracks
let currentFilters = {};

const port = process.env.PORT || 3003;
const server = express();

server.use(express.static('frontend'));
server.use(express.json());
server.use(onEachRequest);
server.get('/api/party/:partyCode/currentTrack', onGetCurrentTrackAtParty);
server.get('/api/nextTrackFromFilters', onPickNextTrackFromFFilters);
server.get(/\/[a-zA-Z0-9-_/]+/, onFallback); // serve index.html on any other simple path
server.listen(port, onServerReady);

async function onGetCurrentTrackAtParty(request, response) {
    const partyCode = request.params.partyCode;
    let trackIndex = currentTracks.get(partyCode);
    if (trackIndex === undefined) {
        trackIndex = pickNextTrackFor(partyCode);
    }
    const track = tracks[trackIndex];
    response.json(track);
}

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}

async function onFallback(request, response) {
    response.sendFile(path.join(import.meta.dirname, '..', 'frontend', 'index.html'));
}

function onServerReady() {
    console.log('Webserver running on port', port);
}

async function loadTracks() {
    const dbResult = await db.query(`
        select track_id, title, artist, length_sec
        from   tracks
    `);
    return dbResult.rows;
}

function pickNextTrackFor(partyCode) {
    const trackIndex = Math.floor(Math.random() * tracks.length)
    currentTracks.set(partyCode, trackIndex);
    const track = tracks[trackIndex];
    play(partyCode, track.track_id, track.length_sec, Date.now(), () => currentTracks.delete(partyCode));
    return trackIndex;
}

//our code below


async function onPickNextTrackFromFFilters(request, response){
    // checks if filters have changed and gets new filtered tracks if so
    const filters = request.query;  // NOT 'request.query'
    console.log("Vibe:", filters.Vibe);
    console.log("Genre:", filters.Genre);
    console.log("Mode:", filters.Mode);
    console.log("Language:", filters.Language);
    console.log("New Music:", filters.NewMusic);
    console.log("decade: " + filters.Decade);
    if (request.query != currentFilters){
        tracks = await getTracksByFilter(filters)
        currentFilters = request.query;
    }
    console.log("Filtered tracks: ", tracks);
    if (tracks.length === 0){
        response.status(404).send("No tracks found for the selected filters.");
        return;
    }
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    console.log("randomTrack: " + randomTrack);
    response.status(200).json(randomTrack);
    return randomTrack;
}

async function getTracksByFilter(filters) {
    const vibeField = filters.Vibe;          // 'happy'
    const modeField = filters.Mode;          // 'fitness'
    const genreField = filters.Genre;        // 'pop'
    const languageValue = filters.Language.toLowerCase();  
let languageField;
switch (languageValue) {
  case 'engelsk':
    languageField = 'english';
    break;
  case 'dansk':
    languageField = 'danish';
    break;
  default:
    languageField = 'all';
}
    const decadeField = filters.Decade.toLowerCase() === 'all' ? 'all' : parseInt(filters.Decade.slice(0, -1)); // '60s' -> 60
    
    const newMusicField = filters.NewMusic;
  
  const dbResult = await db.query(`
    SELECT track_id, title, artist, length_sec
    FROM tracks
    WHERE (LOWER($1) = 'all' OR LOWER(mood) = LOWER($1))
     AND (LOWER($2) = 'all' OR LOWER(mode) = LOWER($2))
     AND (LOWER($3) = 'all' OR LOWER(genre) = LOWER($3))
     AND (LOWER($4) = 'all' OR LOWER(language) = LOWER($4))
     AND (LOWER($5) = 'all' OR (FLOOR((release_year % 100) / 10)) * 10 = CAST($5 AS INT))
     AND (LOWER($6) = 'all' OR (LOWER($6) = 'both')
                            OR (LOWER($6) = 'on' AND release_year = EXTRACT(YEAR FROM CURRENT_DATE))
                            OR LOWER($6) = 'off')`
     ,
    [vibeField, modeField, genreField, languageField, decadeField, newMusicField] );
  return dbResult.rows;
}