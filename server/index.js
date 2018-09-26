const express = require("express");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const rateLimit = require("express-rate-limit");
const rp = require("request-promise");
const cheerio = require("cheerio");

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

spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log("The access token expires in " + data.body["expires_in"]);
    spotifyApi.setAccessToken(data.body["access_token"]);
  },
  function(err) {
    console.log("Something went wrong when retrieving an access token", err);
  }
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.post("/spotify/user", (req, res) => {
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
app.post("/spotify/playlist", (req, res) => {
  let playlistId = req.body.id;
  TracksandKeys(playlistId);
  setTimeout(function() {
    //Replace with async
    //console.log('return')
    res.send(trackKeys);
    trackKeys = [];
  }, 5000);
});
function TracksandKeys(args) {
  spotifyApi.getPlaylistTracks(args,{limit: 100}).then(function(data) {
    let temp = data.body.items;
    for (let b = 0; b < temp.length; b++) {
      let trackName = temp[b].track.name;
      for (let e = 0; e < temp[b].track.artists.length; e++) {
        var trackArtist = temp[b].track.artists[e].name;
      }
      let trackId = temp[b].track.id + ",";
      spotifyApi.getAudioFeaturesForTracks([trackId]).then(function(data) {
        //Split function into 2 l8tr
        let features = data.body.audio_features;
        url =
          "https://www.songsterr.com/a/wa/bestMatchForQueryString?s=" +
          trackName +
          "&a=" +
          trackArtist.replace(/\s+/g, "");
        for (let c = 0; c < features.length; c++) {
          key = features[c].key;
        }
        trackKeys.push({
          artist: trackArtist,
          name: trackName,
          key: key,
          url: url
        });
        scrapeUrl(url, trackName, trackArtist);
      });
    }
  });
}
let url = "";
function scrapeUrl(url, track, artist) {
  counter = 0
  url = url;
  rp({
    url: url,
    transform: function(body) {
      return cheerio.load(body);
    }
  })
    .then(res => {
      artist = artist.replace(/\s+/g, "");
      artistSongsterr = res(".artist-1u304B")
        .text()
        .replace(/\s+/g, "");
      if (artistSongsterr.toLowerCase() == artist.toLowerCase()) {
        // maybe add check for song aswell
        tuning = res(".tuning-1cQdvc").text();
        if (tuning != "") {
          for (let y = 0; y < trackKeys.length; y++) {
            if (trackKeys[y].name == track && trackKeys[y].tuning == null) {
              trackKeys[y] = { ...trackKeys[y], ...{ tuning: tuning } };
              counter++
              //console.log('Tabs found: ' + counter)
            }
          }
        }
      } //console.log('No tab found.')
    })
    .catch(err => {
      return err;
    });
}
