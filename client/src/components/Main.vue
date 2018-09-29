<template>
<div class="pb-5">
<v-toolbar v-if="info && !userNotFound" flat class="foooter">
  <v-layout justify-center row wrap>
    <v-btn flat dark href="https://github.com/breeku/Vue.js-SpotifyTabFinder" target="!blank">Github</v-btn>
    <v-btn flat dark href="http://matiasmakela.com" target="!blank">Author</v-btn>
  </v-layout>
</v-toolbar>
    <v-container class="pt-5" fluid fill-height>
    <v-layout justify-center>
    <v-flex xs12 sm12 md10 lg8 xl-6>
      <!--
      <transition name="slide-y-transition">
      <img v-if="!info | userNotFound" class="logo" src="../assets/soundwaves.svg"/>
      </transition>
      -->
      <div>
      <h3 class="left">Total <br><hr>{{ total }}</h3>
      <h3 class="right">Tabs <br><hr>{{ tabs }}</h3>
      </div>
      <input v-model="user" placeholder="Spotify User">
      <v-btn depressed outline dark large v-on:click="getUser(user)">Search</v-btn>
      <h5 class="pt-3">Current playlist size limit: 50<br>
      Will be upped later.</h5>
      <v-container v-if="loadingUser">
        <v-progress-circular :size="100" :width="7" indeterminate color="purple"/>
      </v-container>
      <h1 v-if="userNotFound" class="display-4 pt-3">User not found!</h1>
      <div v-else-if="info && !userNotFound">
        <v-btn depressed outline dark v-if="page >= 1" v-on:click="(page -= 1),nextPageEmpty = false, getUser(user)">Previous Page</v-btn>
        <v-btn depressed outline dark v-if="!nextPageEmpty" v-on:click="(page += 1), getUser(user)">Next Page</v-btn>
        <v-container class="pt-2 pb-2">
        <v-layout row wrap>
        <v-flex xs12 sm6 md6 lg4 xl-4 v-for="item in info.items" :key="item.id">
          <v-card tile hover>  
            <v-img v-on:click="getPlaylist(item); cardId = item.id; dialog=true" :src="item.images[0].url"/>
          </v-card>
            <v-dialog lazy scrollable v-model="dialog" max-width="500">
            <v-card>
            <v-card-text v-if="playlist && cardId == item.id"> 
              <div v-if="loadingPlaylist">
              <v-progress-circular :size="70" :width="7" indeterminate color="purple"/>
              <h5>If this take's awhile, server is probably scraping for results. <br>
              Depending on the size of your playlist it might take some time :| <br>
              Performance will be improved later on.</h5>
              </div>
              <div v-for="trackinfo in playlist" :key="trackinfo.id">
                <hr>
                <div class="mt-3">
                <p>{{ trackinfo.artist }}</p>
                <p>{{ trackinfo.track }}</p>
                <div v-if="trackinfo.tuning">
                  <h3 style="margin-bottom:0">{{ trackinfo.tuning | tuning }}</h3>
                  <v-btn depressed outline light style="margin-top:1rem;margin-bottom:1rem;" :href="trackinfo.url" target="!blank">Tab</v-btn>    
                </div>
                  <h3 style="margin-bottom:15px;" v-else>No tab found :(</h3>        
              </div>  
              </div>
            </v-card-text>
            </v-card>
            </v-dialog>
        </v-flex>
        </v-layout>
        </v-container>
        <v-btn depressed outline dark v-if="page >= 1" v-on:click="(page -= 1),nextPageEmpty = false, getUser(user)">Previous Page</v-btn>
        <v-btn depressed outline dark v-if="!nextPageEmpty" v-on:click="(page += 1), getUser(user)">Next Page</v-btn>
      </div>
    </v-flex>
    </v-layout>
    </v-container>
  <v-footer absolute class="pa-4 foooter">
    <v-layout justify-center row wrap>
      <v-btn flat dark href="https://github.com/breeku/Vue.js-SpotifyTabFinder" target="!blank">Github</v-btn>
      <v-btn flat dark href="http://matiasmakela.com" target="!blank">Author</v-btn>
    </v-layout>
  </v-footer>
</div>
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
      loadingUser: false,
      loadingPlaylist: false,
      total: 0,
      tabs: 0,
      dialog: false
    };
  },
  filters: {
    tuning: function(str) {
      return str
        .split("")
        .reverse()
        .join("")
        .toUpperCase();
    }
  },
  mounted() {
    this.amountofTabs();
  },
  methods: {
    amountofTabs() {
      let countURL = "https://stark-beyond-77127.herokuapp.com/spotify/count"
      //let countURL = "http://localhost:3000/spotify/count";
      axios.get(countURL).then(response => {
        this.total = response.data.total;
        this.tabs = response.data.tabs;
      });
    },
    getUser(user) {
      if (user != null && user != "") {
        let userURL = "https://stark-beyond-77127.herokuapp.com/spotify/user";
        //let userURL = "http://localhost:3000/spotify/user";
        let page = this.page;
        this.loadingUser = true;
        const userJSON = {
          user: user,
          page: page
        };
        axios.post(userURL, userJSON).then(response => {
          if (response.data.status == 404) {
            this.loadingUser = false;
            this.userNotFound = true;
          } else {
            this.loadingUser = false;
            this.userNotFound = false;
            this.info = response.data.body;
            if (this.info.items.length < 50) {
              this.nextPageEmpty = true;
            }
          }
        });
      } else {
        this.loadingUser = false;
        this.userNotFound = true;
      }
    },
    getPlaylist(arg) {
      //Get Songs
      let playlistURL = "https://stark-beyond-77127.herokuapp.com/spotify/playlist";
      //let playlistURL = "http://localhost:3000/spotify/playlist";
      let playlistId = arg.id;
      this.playlist = [];
      this.loadingPlaylist = true;
      const playlistJSON = {
        id: playlistId
      };
      axios.post(playlistURL, playlistJSON).then(response => {
        this.loadingPlaylist = false;
        this.playlist = response.data;
      });
    }
  }
};
</script>

<style scoped>
input {
  width: 100%;
  text-align: center;
  font-size: 8vw;
  padding: 1rem;
  text-shadow: 0 0 10px black;
}
.logo {
  min-width: 200px;
}
.foooter {
  background-color: transparent;
  color: white;
}
>>> .v-dialog {
  box-shadow: 0 0 15px black !important;
}
</style>
