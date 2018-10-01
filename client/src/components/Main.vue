<template>
<div class="pb-5">
<v-toolbar v-if="info && !userNotFound" flat class="foooter">
  <v-layout justify-center row wrap>
      <h4>Total <br><hr>{{ total }}</h4>
      <v-btn flat dark href="https://github.com/breeku/Vue.js-SpotifyTabFinder" target="!blank">Github</v-btn>
      <v-btn flat dark href="http://matiasmakela.com" target="!blank">Author</v-btn>
      <h4>Tabs <br><hr>{{ tabs }}</h4>
  </v-layout>
</v-toolbar>
    <v-container fluid fill-height>
    <v-layout justify-center>
    <v-flex xs12 sm12 md10 lg8 xl-6>
      <v-form id="smoothTransition" v-on:submit.prevent="getUser(user)" :class="[info && !userNotFound ? 'formnoPadding' : 'formlargePadding']">
          <div transition-name="fade-transition" v-if="!info | userNotFound" class="mainText">
          <h1 class="font-weight-thin">Playlist Tab Finder</h1>
          <h2 class="font-weight-thin font-italic">Search for guitar tabs from your spotify playlists.</h2>
          </div>
          <p v-if="searchArray != ''" class="caption mb-0">Recently searched..
          <transition-group name="scale-transition" tag="p"> 
          <v-chip v-for="searched in searchArray" :key="searched" label outline color="primary" @click="getUser(searched)">{{ searched }}</v-chip>
          </transition-group>
          </p>
        <input autocomplete="off" id="smoothTransition" v-model="user" placeholder="User" :class="[info && !userNotFound ? 'inputSmall' : 'input']" >
        <v-btn depressed outline dark v-on:click="getUser(user)" :class="[info && !userNotFound ? 'mt-0' : 'mt-5']">Search</v-btn>
      </v-form>
      <!--
      <h5 class="pt-3">Current playlist size limit: 40<br>
      Will be upped later.</h5>
      -->
      <v-container v-if="loadingUser">
        <v-progress-circular :size="100" :width="7" indeterminate color="purple"/>
      </v-container>
        <p v-if="userNotFound" class="display-1 font-weight-thin pt-5">User not found!</p>
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
      <h4>Total <br><hr>{{ total }}</h4>
      <v-btn flat dark href="https://github.com/breeku/Vue.js-SpotifyTabFinder" target="!blank">Github</v-btn>
      <v-btn flat dark href="http://matiasmakela.com" target="!blank">Author</v-btn>
      <h4>Tabs <br><hr>{{ tabs }}</h4>
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
      dialog: false,
      searchArray: []
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
    if (localStorage.getItem("searchedUser")) {
      this.getlocalStorage()
    }
  },
  methods: {
    amountofTabs() {
      let countURL = "https://stark-beyond-77127.herokuapp.com/spotify/count";
      //let countURL = "http://localhost:3000/spotify/count";
      axios.get(countURL).then(response => {
        this.total = response.data.total;
        this.tabs = response.data.tabs;
      });
    },
    getlocalStorage() {
      let localStorageUsers = JSON.parse(localStorage.getItem("searchedUser"));
      this.searchArray = localStorageUsers
    },
    getUser(user) {
      this.userNotFound = false;
      if (user != null && user != "") {
        if (this.searchArray.includes(user)) {
        } else if (this.searchArray.length <= 4) {
          this.searchArray.push(user);
        } else {
          this.searchArray.unshift(user);
          this.searchArray.pop()
        }
        localStorage.setItem("searchedUser", JSON.stringify(this.searchArray));
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
      if (this.loadingPlaylist != true) {
        this.loadingPlaylist = true;
        let playlistURL =
          "https://stark-beyond-77127.herokuapp.com/spotify/playlist";
        //let playlistURL = "http://localhost:3000/spotify/playlist";
        let playlistId = arg.id;
        this.playlist = [];
        const playlistJSON = {
          id: playlistId
        };
        axios.post(playlistURL, playlistJSON).then(response => {
          this.alreadyLoading = false;
          this.loadingPlaylist = false;
          this.playlist = response.data;
        });
      } else {
        // Already loading tracks
      }
    }
  }
};
</script>

<style scoped>
.input {
  width: 100%;
  text-align: center;
  font-size: 12em;
  padding: 1rem;
}
.inputSmall {
  width: 100%;
  text-align: center;
  font-size: 8em;
  padding-bottom: 0.5rem;
}
#smoothTransition {
  transition: 1s;
}
.formlargePadding {
  padding-top: calc(18vh - 4em);
}
.formnoPadding {
  padding-top: 0;
}
.mainText {
  padding-bottom: 4em;
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
@media only screen and (max-width: 550px) {
    .input {
      font-size: 8em
    }
    .inputSmall {
      font-size: 4em;
    }
}
</style>
