import { upload } from 'pg-upload';
import { connect } from './connect.js';

console.log('Recreating database...');

const db = await connect();

console.log('Dropping tables...');
await db.query('drop table if exists tracks');
console.log('All tables dropped.');

console.log('Recreating tables...');
await db.query(`
CREATE TABLE tracks (
    track_id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    genre TEXT NOT NULL,
    mood TEXT NOT NULL,
    language TEXT NOT NULL,
    bpm INT NOT NULL,
    length_sec INT NOT NULL,
    release_year INT NOT NULL,
    vocal_instrumental TEXT NOT NULL,
    mode TEXT NOT NULL
    )
`);
console.log('Tables recreated.');

console.log('Importing data from CSV files...');
await upload(db, 'db/music.csv', `
	copy tracks (track_id, title, artist, genre, mood, language, bpm, length_sec, release_year, vocal_instrumental, mode)
	from stdin
	with csv header`
);
console.log('Data imported.');

await db.end();

console.log('Database recreated.');