const express = require("express");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const rateLimit = require("express-rate-limit");
const rp = require("request-promise");
const cheerio = require("cheerio");
const monk = require("monk");
const dburl = "";
const db = monk(dburl);
const dbSongsterr = db.get("songsterr");
const { performance } = require("perf_hooks");

let spotifyApi = new SpotifyWebApi({
  clientId: "f715a876ffa043218b378c7b9cc392bf",
  clientSecret: ""
  //clientSecret: process.env.Secret
});

const app = express();
app.use(express.json());
app.use(cors());


app.listen((process.env.PORT || 5000), () => {
  console.log("Live");
});

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30 // limit each IP to 30 requests per windowMs
});

app.use(limiter); // should limit different paths differently

const getTrackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 80 // limit each IP to 30 requests per windowMs
});

function spotifyAuth() {
  spotifyApi.clientCredentialsGrant().then(
    function(data) {
      console.log("The access token expires in " + data.body["expires_in"]);
      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    function(err) {
      console.log("Something went wrong when retrieving an access token", err);
    }
  );
}
spotifyAuth();

app.get("/spotify/count", async (req, res) => {
  try {
  let artistCount = await dbSongsterr.count({track: {$exists: true}})
  let notTabs = await dbSongsterr.count({tuning: {$type: "bool"}})
  let tabCount = await artistCount - notTabs
  let result = {
    total: artistCount,
    tabs: tabCount
  }
  res.send(await result)
  } catch(e) {
    console.log(e)
  }
})
app.post("/spotify/user", async (req, res) => {
  await spotifyAuth();
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
app.post("/spotify/playlist", async (req, res) => {
  try {
  var t0 = performance.now();
  res.send(await getpTracks(req.body.id));
  var t1 = performance.now();
  console.log("Call took " + (t1 - t0) + " milliseconds.");
  } catch(e) {
    console.log(e)
  }
});
async function getpTracks(args) {
  const result = [];
  const data = await spotifyApi.getPlaylistTracks(args, { limit: 100 });
  let temp = data.body.items;
  for (const {
    track: { name: trackName, artists }
  } of temp) {
    const trackArtist = artists[artists.length - 1].name; // gets wrong name if theres more than one name in artists
    // TODO: use Promise.all to parallelize
    await dbChecks(trackName, trackArtist, result);
  }
  return result;
}
async function dbChecks(trackName, trackArtist, result = []) {
  try {
    const response = await dbSongsterr.findOne({
      artist: trackArtist,
      track: trackName
    }); // get results from mongo
    if (
      //if we find results,
      response != null &&
      response.artist == trackArtist &&
      response.track == trackName
    ) {
      result.push({
        //push them into array
        artist: response.artist,
        track: response.track,
        url: response.url,
        tuning: response.tuning
      });
    } else {
      result.push({
        artist: trackArtist,
        track: trackName,
      });
      dbSongsterr.insert({
        artist: trackArtist,
        track: trackName,
      });
      //if no results found, insert empty
    }
  } catch (error) {
    console.log("Error: " + error);
  }
  return result;
}
app.post("/spotify/gettab", getTrackLimiter, async (req, res) => {
  try {
  var t0 = performance.now();
  res.send(await scrapeUrl(req.body.artist, req.body.track));
  var t1 = performance.now();
  console.log("Call took " + (t1 - t0) + " milliseconds.");
  } catch(e) {
    console.log(e)
  }
});
async function scrapeUrl(artist, track, result = []) {
  const songsterrUrl = "https://www.songsterr.com/a/wa/bestMatchForQueryString?s=";
  const url = songsterrUrl + track + "&a=" + artist; // url constructor
  console.log(url)
  console.log(artist + " ||| " + track);
  try {
    const res = await rp({
      url,
      transform: function(body) {
        return cheerio.load(body);
      }
    });
    const tempartist = artist.replace(/\s+/g, "");
    const artistSongsterr = await res(".artist-1u304B")
      .text()
      .replace(/\s+/g, ""); // tab page artist name
    if (
      artistSongsterr != "" &&
      artistSongsterr.toLowerCase() == tempartist.toLowerCase()
    ) {
      // maybe add check for song aswell
      const tuning = await res(".tuning-1cQdvc").text(); // tab page tuning
      result.push({
        artist: artist,
        track: track,
        url: url,
        tuning: tuning
      });
      dbSongsterr.findOneAndUpdate(
        {
        artist: artist,
        track: track 
        },
        {
        artist: artist,
        track: track,
        url: url,
        tuning: tuning
        }
      );
    } else {
      result.push({
        // if didnt pass artist name check then
        artist: artist,
        track: track,
        url: false,
        tuning: false
      });
      dbSongsterr.findOneAndUpdate(
        {
        artist: artist,
        track: track 
        },
        {
        artist: artist,
        track: track,
        url: false,
        tuning: false
        }
      );
    }
  } catch (error) {
    console.log("Site crawl fail");
  }
  return result;
}