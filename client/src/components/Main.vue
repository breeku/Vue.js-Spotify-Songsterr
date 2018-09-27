<template>
    <v-container fluid fill-height>
    <v-layout justify-center>
    <v-flex xs12 sm10 md8 lg8 xl-6>
      <input v-model="user" placeholder="Spotify User"></input>
      <v-btn v-on:click="getUser(user)">Search</v-btn>
      <p>Playlist limit: 100</p>
      <div v-if="userNotFound"><h1>User not found!</h1></div>
      <div v-else-if="info">
        <v-btn v-if="page >= 1" v-on:click="(page -= 1), getUser(user)">Previous Page</v-btn>
        <v-btn v-if="!nextPageEmpty" v-on:click="(page += 1), getUser(user)">Next Page</v-btn>
        <v-container>
        <v-layout row wrap>
        <v-flex xs12 sm6 md6 lg4 xl-4 v-for="item in info.items" :key="item.id">
          <v-card tile hover>  
              <v-img v-on:click="getPlaylist(item); cardId = item.id" :src="item.images[0].url"/>
            <v-card-text v-if="playlist && cardId == item.id"> 
              <v-progress-circular v-if="loading" :size="70" :width="7" indeterminate color="purple"/>
              <transition-group name="slide-y-transition" tag="div">
              <div v-for="trackinfo in playlist" :key="trackinfo">
                <hr>
                <div class="mt-3">
                <p>Artist: {{ trackinfo.artist }}</p>
                <p>Track: {{ trackinfo.name }}</p>
                <p>Key: {{ trackinfo.key }}</p>
                <div v-if="trackinfo.tuning">
                  <h3 style="margin-bottom:0">Tuning: {{ trackinfo.tuning }}</h3>
                  <v-btn large style="margin-top:1rem;margin-bottom:1rem;" :href="trackinfo.url" target="!blank">Tab</v-btn>    
                </div>
                  <p v-else>Tab not found.</p>        
                </div>
              </div>
              </transition-group>      
            </v-card-text>
          </v-card>
        </v-flex>
        </v-layout>
        </v-container>
        <v-btn v-if="page >= 1" v-on:click="(page -= 1), getUser(user)">Previous Page</v-btn>
        <v-btn v-if="!nextPageEmpty" v-on:click="(page += 1), getUser(user)">Next Page</v-btn>
      </div>
    </v-flex>
    </v-layout>
    </v-container>
</template>

<script>
const axios = require("axios");

export default {
  name: "mainPage",
  data() {
    return {
      user: null,
      info: null,
      playlist: null,
      page: 0,
      nextPageEmpty: false,
      userNotFound: false,
      cardId: null,
      loading: false,
    };
  },
  created() {},
  methods: {
    getUser(user) {
      if (user != null) {
        //let userURL = "https://spotifysongsterrapi.now.sh/spotify/user";
        let userURL = "http://localhost:3000/spotify/user";
        let page = this.page;
        const userJSON = {
          user: user,
          page: page
        };
        axios.post(userURL, userJSON).then(response => {
          if (response.data.status == 404) {
            this.userNotFound = true;
          } else {
            this.userNotFound = false;
            this.info = response.data.body;
            if (this.info.items.length < 50) {
              this.nextPageEmpty = true;
            }
          }
        });
      } else {
        this.userNotFound = true
      }
    },
    getPlaylist(arg) {
      //let playlistURL = "https://spotifysongsterrapi.now.sh/spotify/playlist";
      let playlistURL = "http://localhost:3000/spotify/playlist";
      let playlistId = arg.id
      this.playlist = []
      this.loading = true
      const playlistJSON = {
        id: playlistId
      }
      axios.post(playlistURL, playlistJSON).then(response => {
        this.loading = false
        this.playlist = response.data
        console.log(this.playlist[0])
      })
    }
  }
};
</script>

<style scoped>
input {
  width: 100%;
  text-align: center;
  font-size: 100px;
  padding: 2rem;
}
</style>