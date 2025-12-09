
//image const for albums
const images = [
  "images/album1.jpg",
  "images/album2.jpg",
  "images/album3.jpg",
  "images/album4.jpg",
  "images/album5.jpg"
];

//track info elements for faster access
const playerDiv = document.querySelector(".player"); // single element
const songTitle = playerDiv.querySelector("#songTitle");
const songArtist = playerDiv.querySelector("#songArtist");
const currentTime = playerDiv.querySelector("#currentTime");
const duration = playerDiv.querySelector("#duration");
const imageDiv = document.querySelector('.songImage');

function handleTrackNotFound(){
    //todo show message to user
    const popup = document.getElementById("popup-message");
    popup.style.display = "block";

    isPlaying = false;
     //playBtn.textContent = "▶";
    playIcon.textContent = "play_arrow";
    // Hide it after 9 seconds
    setTimeout(() => {
        popup.style.display = "none";
    }, 9000);
};

async function pickNextTrack(){
    const filters = getSelectedFilter();
    //(URLSearchParams) convert an record (object of key-value pairs) into a query string for a URL
    //{Vibe: "Happy", Language: "English", Genre: "Pop"} => Vibe=Happy&Language=English&Genre=Pop
    const query = new URLSearchParams(filters).toString();
    const path = `/api/nextTrackFromFilters?${query}`;
    /*fetch from server.js with the endpoint /api/nextTrackFromFilters*/
    const response = await fetch(path);
    if (!response.ok) {
        // not found any tracks for the selected filters error handleing
        if (response.status === 404) {
                handleTrackNotFound();
                return null;
            }
        // other errors
        throw new Error(`GET ${path} failed with ${response.status} ${response.statusText}`);
    }
    /*console.log("Rendering response: ", response);*/
    const track = await response.json();
    /*console.log("Rendering track: ", track);*/
    renderPlayingTrack(track);
    currentTrack = track;
    return track;
}

//make a record like {Vibe: "Happy", Language: "English", Genre: "Pop"}
function getSelectedFilter(){
    const selected = {};

    document.querySelectorAll('.buttons select').forEach(select => {
        selected[select.id] = select.value;
    });

    return selected;
}


// PLayer button 
let isPlaying = false;
const playBtn = document.getElementById("playBtn");
const playIcon = playBtn.querySelector("span");
playBtn.onclick = () => {
    if (!isPlaying) {
        //playBtn.textContent = "❚❚";
        playIcon.textContent = "pause";
        isPlaying = true;
        playSong()

    } else {
        //playBtn.textContent = "▶";
        playIcon.textContent = "play_arrow";
        isPlaying = false;
    }
};

// previous button 
let prevSongList = [];
let currentTrack = null;
prevBtn.onclick = () => {
    if(prevSongList.length > 0){
        currentTrack = prevSongList.pop();
        renderPlayingTrack(currentTrack);
    }
};

nextBtn.onclick = () => {
    prevSongList.push(currentTrack);
    pickNextTrack();
};

//play track function
async function playSong(){
    if(currentTrack === null) {
       await pickNextTrack()
    };
    if(currentTrack !== null) {
        lastUpdateTime = performance.now();
        updateTime();
    };
}

let playTimeCurrent = 0;

let lastUpdateTime = null; // timestamp of last update

async function updateTime() {
    if (!isPlaying) return; // Stop if paused

    const now = performance.now(); // high-res timestamp in ms

    // Update play time 
    if (lastUpdateTime !== null) {
        const deltaSeconds = (now - lastUpdateTime) / 1000; // convert ms to seconds
        playTimeCurrent += deltaSeconds;
    }

    lastUpdateTime = now;
    // Calculate minutes and seconds
    const minutes = Math.floor(playTimeCurrent / 60)
        .toString()
        .padStart(2, '0'); //
    const seconds = Math.floor(playTimeCurrent % 60)
        .toString()
        .padStart(2, '0'); //to ensure two digits

    // Update UI
    currentTime.textContent = `${minutes}:${seconds}`;

    renderProgressBar();
    // Check if track has ended
    if (playTimeCurrent >= currentTrack.length_sec) {
        // track ended, pick next track
        playTimeCurrent = 0;
        await pickNextTrack();
        if (!isPlaying) return; // Stop if paused after picking next track
    }
    setTimeout(() => updateTime(), 1000); // refresh every 1000ms
}

const barFill = playerDiv.querySelector("#barFill");
function renderProgressBar(){
    //05:03 -> 05 * 60 + 03 = 303 seconds
    let currentTimeValue = parseInt(currentTime.textContent.split(":")[0]) * 60 + parseInt(currentTime.textContent.split(":")[1]);
    let durationValue = parseInt(duration.textContent.split(":")[0]) * 60 + parseInt(duration.textContent.split(":")[1]);
    const pct = (currentTimeValue / durationValue) * 100;

    barFill.style.width = pct + "%";
    return;
}


function renderPlayingTrack(track){
    
    //updates the track info
    songTitle.textContent = track.title;
    songArtist.textContent = track.artist;
    duration.textContent = `${Math.floor(track.length_sec/60)}:${(track.length_sec % 60).toString().padStart(2, '0')}`;
    
    //display album image for the track
    const randomImage = images[Math.floor(Math.random() * images.length)];
    imageDiv.style.backgroundImage = `url(${randomImage})`;

    //reset time and progress bar
    currentTime.textContent = "00:00";
    playTimeCurrent = 0;
    renderProgressBar();
}

//todo repeat button
let repeat = false;
const repeatBtn = document.getElementById("repeatBtn");
repeatBtn.onclick = () => {
    repeat = !repeat;
    repeatBtn.classList.toggle("active", repeat);
}