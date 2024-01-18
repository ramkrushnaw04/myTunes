let songsPath = 'http://127.0.0.1:5500/songs/'
const playlistsPath = 'http://127.0.0.1:5500/playlists/'
const player = new Audio()
let songs
let currSongInd = 0
let maxCurrSongInd;
let timeoutId // for blur effect of sound and left menu
let leftMenuExpanded = 0
let songRepeated = 0
let previousSong = null // this varibale is used to highlight song in left section
let previousPlaylist = null // this varibale is used when to highlight playlist playing currently
const activeColor = 'rgb(79 29 29)'
const playlistActiveColor = 'rgb(79 29 29)'






function secondsToMinutesAndSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}









// gets song from user folder
async function getSongs(path) {
    let html = await fetch(path)
    let data = await html.text()

    let div = document.createElement('div')
    div.innerHTML = data

    let as = div.getElementsByTagName('a')
    let songs = []



    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        // console.log(element)
        if (element.href.endsWith('.mp3'))
            songs.push(element.href)
    }

    return songs
}







function getAllOccurrences(str, searchTerm) {
    let occurrences = [];
    let index = str.indexOf(searchTerm);

    while (index !== -1) {
        occurrences.push(index);
        index = str.indexOf(searchTerm, index + 1);
    }

    return occurrences;
}









// returns summery of current song
async function getLyrics(url) {
    let html = await fetch(url.slice(0, url.lastIndexOf('/')) + '/lyrics.txt')
    let data = await html.text()
    let ind = songs.indexOf(url.replaceAll(' ', '%20'))

    const indices = getAllOccurrences(data, '|')
    return data.slice(indices[ind] + 1, indices[ind + 1]).replaceAll('#', '<br><br>')
}










// plays song
async function playSong(url) {

    const ind = songs.indexOf(url.replaceAll(' ', '%20'))
    currSongInd = ind


    const lis = Array.from(document.querySelector('.library').getElementsByTagName('ul')[0].getElementsByTagName('li'))
    
    const li = lis[ind]
    
    previousSong.removeAttribute('style')
    li.style.backgroundColor = activeColor
    previousSong = li


    player.src = url
    player.play()
    document.getElementById('play').src = 'Assets/pause.svg'
    let k = url.split('/').length
    document.getElementById('songName').innerHTML = url.split('/')[k - 1].replaceAll('%20', ' ').replace('.mp3', '')

    try {
        const lyrics = await getLyrics(url.replaceAll(' ', '%20'))
        document.querySelector('.lyrics').getElementsByTagName('p')[0].innerHTML = lyrics
    }
    catch { }

}









// appends songs to left library section
function appendSongs(path, songs) {

    previousSong = null

    let library = document.querySelector('.library').getElementsByTagName('ul')[0]
    library.innerHTML = ""

    for (const song of songs) {
        let k = song.split('/').length
        const songName = song.split('/')[k - 1].replaceAll('%20', ' ').replace('.mp3', '')

        const template =
        `<li>
            <img width='16px' src="Assets/music.svg" alt="SongImg">
            <div class="song-info">
                <span>${songName}</span>
                <span>${(song.split('/')[4]).replaceAll('%20', ' ').replace('.mp3', '')}</span>
            </div>
            <img width='14px' src="Assets/play.svg" alt="">
        </li>`

        library.classList.add('playlist-active')

        library.innerHTML += template
    }

    // adding eventlistner to each song in the left menu
    Array.from(document.querySelector('.library').getElementsByTagName('li')).forEach((ele) => {


        // applying active color to first song
        if(previousSong == null) {

            ele.style.backgroundColor = activeColor
            previousSong = ele
            // currSongInd = songs.indexOf(song)
        }

        ele.addEventListener('click', () => {

            // reset color of previous song
            if(previousSong != null)
                previousSong.removeAttribute('style')


            // set new color to current song
            ele.style.backgroundColor = activeColor
            previousSong = ele

            
            url = path + (ele.querySelector('.song-info').firstElementChild.innerHTML) + '.mp3'
            playSong(url)
        })
    });

    // placing first song when site starts
    player.src = songs[0]
    document.getElementById('songName').innerHTML = songs[0].split('/')[4].replaceAll('%20', ' ').replace('.mp3', '')

}











// manages working of pause, previous and next buttons
function controls() {
    const playButton = document.getElementById('play')

    playButton.addEventListener('click', () => {
        if (player.src != "") {
            if (player.paused) {
                playButton.src = 'Assets/pause.svg'
                player.play()
            }
            else {
                playButton.src = 'Assets/play.svg'
                player.pause()
            }
        }

    })

    document.getElementById('next').addEventListener('click', () => {
        if (currSongInd + 1 < maxCurrSongInd) {
            playSong(songs[++currSongInd])
        }
    })

    document.getElementById('previous').addEventListener('click', () => {
        if (currSongInd - 1 >= 0)
            playSong(songs[--currSongInd])
    })

}










// handles keyboard keypresses
function keyboardControls() {
    const playButton = document.getElementById('play')

    // pause/resume
    document.addEventListener('keydown', (event) => {
        if (event.key == ' ') {
            if (player.src != "") {
                if (player.paused) {
                    playButton.src = 'Assets/pause.svg'
                    player.play()
                }
                else {
                    playButton.src = 'Assets/play.svg'
                    player.pause()
                }
            }
        }
        // pre song
        if (event.key == 'ArrowRight') {
            if (currSongInd + 1 < maxCurrSongInd)
                playSong(songs[++currSongInd])
        }

        // next song
        if (event.key == 'ArrowLeft') {
            if (currSongInd - 1 >= 0)
                playSong(songs[--currSongInd])
        }

        //  dec sound
        if (event.key == 'ArrowDown') {
            let percentage = Math.max(player.volume * 100 - 10, 0);
            soundControl(percentage)

        }

        // inc sound
        if (event.key == 'ArrowUp') {
            let percentage = Math.min(player.volume * 100 + 10, 100);
            soundControl(percentage)
        }

        // minimise/maximise big player
        if (event.key == 'm') {
            document.querySelector('.bigPlayer').classList.toggle('bigPlayer-expanded')
            document.querySelector('.expandBigPlayer').classList.toggle('expandBigPlayer-rotated')
        }

        if (event.key == 'e') {
            if (leftMenuExpanded)
                expandLeftMenu(0)
            else {
                if (window.innerWidth <= 1100)
                    expandLeftMenu(1)
            }
        }

        // seek forward
        if (event.key == 'l') {
            seekBarFunction(player.currentTime += 5)
        }
        // seek backwards
        if (event.key == 'j') {
            seekBarFunction(player.currentTime -= 5)
        }

        // repeat
        if (event.key == 'r') {
            songRepeated = !songRepeated

            if (songRepeated)
                document.querySelector('.repeatSong').setAttribute('src', 'Assets/autoplay.svg')
            else
                document.querySelector('.repeatSong').setAttribute('src', 'Assets/autoplayOff.svg')
        }
    })
}












function expandLeftMenu(operation) {

    // operation is 1: expand menu
    // operation is 0: collapse menu

    const blurWindow = document.querySelector('.blurWindow')
    let left = document.querySelector('.left')

    if (operation) {
        left.style.left = "0%"
        blurWindow.classList.add('blurWindow-active')
    }
    else {
        left.style.left = "-100%"
        blurWindow.classList.remove('blurWindow-active')
    }

    blurWindow.innerHTML = ""
    leftMenuExpanded = !leftMenuExpanded


}














// also handles blurWindow while opening and closing left menu
function hamburgerMenuActivate() {

    const blurWindow = document.querySelector('.blurWindow')

    document.querySelector('.hamburger').addEventListener('click', (e) => {
        expandLeftMenu(1)
    })


    document.querySelector('.cross').addEventListener('click', (e) => {
        expandLeftMenu(0)
    })
}












// manages expanding and collapsing of expanded song menu
function bigPlayer() {
    let bigPlayer = document.querySelector('.bigPlayer')

    document.querySelector('.expandBigPlayer').addEventListener('click', (e) => {
        bigPlayer.classList.toggle('bigPlayer-expanded')
        document.querySelector('.expandBigPlayer').classList.toggle('expandBigPlayer-rotated')

    })


}













// gets links to playlists from user folder
async function getPlaylists(path) {
    let a = await fetch(path)
    let text = await a.text();

    let div = document.createElement('div')
    div.innerHTML = text

    let playlists = []

    Array.from(div.getElementsByTagName('a')).forEach((e) => {
        let l = e.href.split('/')[4]
        if (l != undefined)
            playlists.push(playlistsPath + l)
    })

    return playlists
}











// appends playlists from user folders to dom
async function appendPlaylists(playlists) {
    let cont = document.querySelector('.playlists');

    for (const playlist of playlists) {
        const thumbnail = playlist + '/playlistIcon.jpg';
        const title = playlist.split('/')[4].replaceAll('%20', ' ');
        const k = await getSongs(playlist)

        cont.innerHTML +=
            `<div class="songCard">
                <img class="songCardThumbnail" src="${thumbnail}" alt="Image">
                <img class="songCardPopUp" src="Assets/one.svg" alt="" >
                <h4>${title}</h4>
                <p>${k.length + ' Records'}</p>
            </div>`;

    }

    let songcards = Array.from(document.querySelector('.playlists').querySelectorAll('.songCard'))





    // adding eventlistner so that when pressed on them music starts playing
    for (const song of songcards) {

        // song.addEventListener('mouseenter', ()=>{
        //     song.getElementsByTagName('img')[0].style = 'filter : brightness(0.6); z-index: -0;'
        // })
        // song.addEventListener('mouseleave', ()=>{
        //     song.getElementsByTagName('img')[0].removeAttribute('style')
        // })

        song.addEventListener('click', async () => {

            // resetting previousplaylist bgcolor
            if(previousPlaylist != null)
                previousPlaylist.removeAttribute('style')
            
            previousPlaylist = song
            song.style.backgroundColor = playlistActiveColor



            const playlistName = song.getElementsByTagName('h4')[0].innerHTML

            let path = 'http://127.0.0.1:5500/playlists/' + playlistName + '/'
            songs = await getSongs(path)
            appendSongs(path, songs)

            // setup songs list and maxCurrSongInd for prev and forw actions
            playSong(songs[0])
            maxCurrSongInd = songs.length
            currSongInd = 0


            // adding functionality to bigPlayer
            // 1. set innerHTML of .bigPlayer
            let doc = await fetch(path + 'info.txt')
            let artistInfo = await doc.text()


            let songLyrics = await getLyrics(songs[0])


            let bPlayer = document.querySelector('.bigPlayer')
            bPlayer.innerHTML =
                `<div class="artist">
                <div>
                    <img src="${path + 'playlistIcon.jpg'}" alt="ArtistImage">
                    <h2 style='padding-top:20px'>${playlistName}</h2>
                </div>
                <p>${artistInfo}</p>
            </div>

            <div class="lyrics">
                <h2>Lyrics</h2>
                <p>${songLyrics}</p>
            </div>`

            // 2. turn on .bigPlayer
            bPlayer.classList.toggle('bigPlayer-expanded')
            document.querySelector('.expandBigPlayer').classList.toggle('expandBigPlayer-rotated')
            document.querySelector('.yourLibrary').getElementsByTagName('span')[0].innerHTML = playlistName
        })


        // the hovering play button that appears when hovered above soundCard

        let icon = song.querySelector('.songCardPopUp')
        song.addEventListener('mouseenter', ()=>{
            icon.classList.add('songCardPopUpActive')
        })
        song.addEventListener('mouseleave', ()=>{
            icon.classList.remove('songCardPopUpActive')
        })



    }

}













// adds event listner to soundbar
function soundBar() {

    document.querySelector('.soundBar').addEventListener('click', (e) => {
        let percentage = e.offsetX / document.querySelector('.soundBar').getBoundingClientRect().width * 100
        soundControl(percentage)
    })
}












function soundControl(percentage) {

    const blurWindow = document.querySelector('.blurWindow')

    document.querySelector('.soundPointer').style.left = Math.min(percentage, 97) + '%'
    document.querySelector('.soundBarComplitionBar').style.width = percentage +3+ '%'
    player.volume = percentage / 100

    // handling blur of percentage
    blurWindow.innerHTML = `<img src="Assets/volume.svg" alt="">
        <span>${Math.floor(player.volume * 100) + '%'}</span>`
    blurWindow.classList.add('blurWindow-active')

    // automatically hide blur after 1.5 sec
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
        if (!leftMenuExpanded) {
            blurWindow.classList.remove('blurWindow-active')
            blurWindow.innerHTML = ""
        }
        else {
            blurWindow.innerHTML = ""
        }
    }, 1500);
}













// hides blur when clicked on blured portion
function hideBlur() {
    document.querySelector('.blurWindow').addEventListener('click', () => {
        if (!leftMenuExpanded) {
            document.querySelector('.blurWindow').classList.remove('blurWindow-active')
            document.querySelector('.blurWindow').innerHTML = ""
        }
    })
}
















function repeatSong() {
    if (songRepeated) {
        playSong(songs[currSongInd])
    }
    else {
        if (currSongInd + 1 < songs.length) {
            playSong(songs[++currSongInd])
        }
    }
}










// adding touch to comlpition bar
function complitionBarFunctionality() {

    const bar = document.querySelector('.complitionBar')
    
    bar.addEventListener('click', (event)=>{
        let seekAmount = event.offsetX / document.querySelector('.seekBar').getBoundingClientRect().width * 100

        document.querySelector('.seekPointer').style.left = seekAmount + '%'
        bar.style.width = seekAmount + '%'

        player.currentTime = seekAmount * player.duration / 100

    })
}









// core functionaliy of seekbar
function seekBarFunction(complition) {

    document.getElementById('time').innerHTML = `${secondsToMinutesAndSeconds(player.currentTime)} / ${secondsToMinutesAndSeconds(player.duration)}`


    // moving seekPointer
    document.querySelector('.seekPointer').style.left = Math.min(complition, 98.7) + '%'
    document.querySelector('.complitionBar').style.width = Math.min(complition, 98.7) + '%'

    if (complition == 100) {
        repeatSong()
    }



    document.querySelector('.seekBar').addEventListener('click', (event) => {

        let seekAmount = event.offsetX / event.target.getBoundingClientRect().width * 100

        // making seekbar work
        document.querySelector('.seekPointer').style.left = seekAmount + '%'
        player.currentTime = seekAmount * player.duration / 100

    })
}















async function main() {

    // appendSongs(songsPath, songs)

    // playBar(songs)
    // songs = await getSongs(songsPath)

    // songs = await getSongs('http://127.0.0.1:5500/playlists/KRSNA/')
    // maxCurrSongInd = songs.length
    // console.log('songs', songs)


    player.volume = 0.5

    controls()
    keyboardControls()


    let playlists = await getPlaylists(playlistsPath)
    appendPlaylists(playlists)





    // operates seekbar on clicks
    player.addEventListener('timeupdate', () => {
        seekBarFunction(player.currentTime / player.duration * 100)
    })

    document.querySelector('.repeatSong').addEventListener('click', () => {
        songRepeated = !songRepeated

        if (songRepeated)
            document.querySelector('.repeatSong').setAttribute('src', 'Assets/autoplay.svg')
        else
            document.querySelector('.repeatSong').setAttribute('src', 'Assets/autoplayOff.svg')
    })




    hamburgerMenuActivate()
    bigPlayer()
    soundBar()
    hideBlur()
    complitionBarFunctionality()


}

main()