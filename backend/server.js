import express from 'express';
import path from 'path';
import { connect } from '../db/connect.js';


const db = await connect();
let tracks = await loadTracks();
let currentFilters = {};

const port = process.env.PORT || 3003;
const server = express();

server.use(express.static('frontend'));
server.use(express.json());
server.use(onEachRequest);
server.get('/api/nextTrackFromFilters', onPickNextTrackFromFilters);
server.get(/\/[a-zA-Z0-9-_/]+/, onFallback); // serve index.html on any other simple path
server.listen(port, onServerReady);

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

async function onPickNextTrackFromFilters(request, response){
    const filters = request.query; 

    //only get new tracks if filters have changed
    if (filters != currentFilters){
        tracks = await getTracksByFilter(filters)
        currentFilters = filters;
    }
    
    //if no tracks found for the selected filters
    if (tracks.length === 0){
        response.status(404).send();
        return;
    }
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

    response.status(200).json(randomTrack);
    return;
}

async function getTracksByFilter(filters) {
    const vibeField = filters.Vibe;
    const modeField = filters.Mode;
    const genreField = filters.Genre;
    const languageValue = filters.Language.toLowerCase();  
let languageField; 
// translate from danish to english field names dansk -> danish, engelsk -> english
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