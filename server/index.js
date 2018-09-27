const express = require("express");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const rateLimit = require("express-rate-limit");
const rp = require("request-promise");
const cheerio = require("cheerio");
const { performance } = require("perf_hooks");
const monk = require("monk");

const dburl = "localhost:27017/songsterr";
const db = monk(dburl);
const dbSongsterr = db.get("songsterr");

let spotifyApi = new SpotifyWebApi({
  clientId: "f715a876ffa043218b378c7b9cc392bf",
  clientSecret: ""
  //clientSecret: process.env.Secret
});

const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;
app.listen(port, () => {
  console.log("Live on " + port);
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log("The access token expires in " + data.body["expires_in"]);
    spotifyApi.setAccessToken(data.body["access_token"]);
  },
  function(err) {
    console.log("Something went wrong when retrieving an access token", err);
  }
);

app.post("/spotify/user", (req, res) => {
  spotifyApi.clientCredentialsGrant().then(
    function(data) {
      console.log("The access token expires in " + data.body["expires_in"]);
      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    function(err) {
      console.log("Something went wrong when retrieving an access token", err);
    }
  );
  let user = req.body.user;
  let page = req.body.page;
  if (page == 0) {
    spotifyApi.getUserPlaylists(user, { limit: 50 }).then(
      function(data) {
        if (data.body.items.length == 0) {
          res.send({
            status: 404
          });
        } else {
          res.send(data);
        }
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  } else if (page == 1) {
    spotifyApi.getUserPlaylists(user, { limit: 50, offset: 49 }).then(
      function(data) {
        res.send(data);
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  } else if (page == 2) {
    spotifyApi.getUserPlaylists(user, { limit: 50, offset: 99 }).then(
      function(data) {
        res.send(data);
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  } else if (page == 3) {
    spotifyApi.getUserPlaylists(user, { limit: 50, offset: 149 }).then(
      function(data) {
        res.send(data);
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  } else if (page == 4) {
    spotifyApi.getUserPlaylists(user, { limit: 50, offset: 199 }).then(
      function(data) {
        res.send(data);
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  }
});
let trackKeys = [];
var t0 = null;
var t1 = null;
let counter = 0
let counterb = 0
app.post("/spotify/playlist", (req, res) => {
  let playlistId = req.body.id;
  t0 = performance.now();
  TracksandKeys(playlistId);
  let waitTime = setInterval(waitTillReady, 500);
  function waitTillReady() { // REPLACE WITH ASYNC!!!
    if (counter == trackKeys.length || counterb == trackKeys.length || counter + counterb == trackKeys.length) {
      counter = 0
      counterb = 0
      clearTimeout(waitTime);
      res.send(trackKeys);
      t1 = performance.now();
      console.log("Call took " + (t1 - t0) + " milliseconds.");
      trackKeys = [];
    } else {
      console.log('Not ready')
      console.log('a: ' + counter + '||' + trackKeys.length)
      console.log('b: ' + counterb + '||' + trackKeys.length)
    }
  }
});
function TracksandKeys(args) {
  spotifyApi.getPlaylistTracks(args, { limit: 100 }).then(function(data) {
    let temp = data.body.items;
    for (let b = 0; b < temp.length; b++) {
      let trackName = temp[b].track.name;
      for (let e = 0; e < temp[b].track.artists.length; e++) {
        var trackArtist = temp[b].track.artists[e].name.replace(/\s+/g, "");
      }
      let trackId = temp[b].track.id + ",";
      spotifyApi.getAudioFeaturesForTracks([trackId]).then(function(data) {
        //Split function into 2 l8tr
        url =
          "https://www.songsterr.com/a/wa/bestMatchForQueryString?s=" +
          trackName +
          "&a=" +
          trackArtist;
        dbSongsterr
          .findOne({artist: trackArtist, track: trackName}) // get results from mongo
          .then(response => {
            if ( //if we find results,
              response != null &&
              response.artist == trackArtist &&
              response.track == trackName
              ) {
              console.log("found");
              counter++
              trackKeys.push({ //push them into array
                artist: response.artist,
                name: response.track,
                url: response.url,
                tuning: response.tuning
              });
            } else if (response == null) { //if no results found, go webscrape
              trackKeys.push({
                artist: trackArtist,
                name: trackName,
                url: url
              });
              scrapeUrl(url, trackName, trackArtist);
              console.log("empty");
            }
          })
          .catch(error => {
            console.log("Error: " + error);
          });
      });
    }
  });
}

function scrapeUrl(url, track, artist) {
  url = url;
  rp({
    url: url,
    transform: function(body) {
      return cheerio.load(body);
    }
  })
    .then(res => {
      artist = artist.replace(/\s+/g, "");
      artistSongsterr = res(".artist-1u304B") // tab page artist name
        .text()
        .replace(/\s+/g, "");
        counterb++
        if (artistSongsterr.toLowerCase() == artist.toLowerCase()) {
          // maybe add check for song aswell
          tuning = res(".tuning-1cQdvc").text(); // tab page tuning
          if (tuning != "") {
            for (let y = 0; y < trackKeys.length; y++) {
              if (trackKeys[y].name == track && trackKeys[y].tuning == null) {
                trackKeys[y] = { ...trackKeys[y], ...{ tuning: tuning } };
                dbSongsterr.insert({
                  artist: artist,
                  track: track,
                  url: url,
                  tuning: tuning
                });
              }
            }
          }
        } else {
          dbSongsterr.insert({ // if didnt pass artist name check then
            artist: artist,
            track: track,
            url: false,
            tuning: false
          });
      }
    })
    .catch(err => {
      return err;
    });
}
