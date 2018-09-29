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
  console.log("Live on");
});

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30 // limit each IP to 30 requests per windowMs
});

app.use(limiter); // should limit different paths differently

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
app.post("/spotify/user", (req, res) => {
  spotifyAuth();
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
var amountOfTracks = 0;
async function getpTracks(args) {
  const result = [];
  const data = await spotifyApi.getPlaylistTracks(args, { limit: 50 });
  let temp = data.body.items;
  amountOfTracks = temp.length;
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
  const url = "https://www.songsterr.com/a/wa/bestMatchForQueryString?s=";
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
      //if no results found, go webscrape
      const urli = url + trackName + "&a=" + trackArtist; // url constructor
      await scrapeUrl(urli, trackName, trackArtist, result);
    }
  } catch (error) {
    console.log("Error: " + error);
  }
  return result;
}
async function scrapeUrl(url, track, artist, result = []) {
  console.log(artist + " ||| " + track);
  console.log(result.length + " / " + amountOfTracks);
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
      dbSongsterr.insert({
        artist: artist,
        track: track,
        url: url,
        tuning: tuning
      });
    } else {
      result.push({
        // if didnt pass artist name check then
        artist: artist,
        track: track,
        url: false,
        tuning: false
      });
      dbSongsterr.insert({
        artist: artist,
        track: track,
        url: false,
        tuning: false
      });
    }
  } catch (error) {
    console.log("Site crawl fail");
  }
  return result;
}
