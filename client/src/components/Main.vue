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
          <v-chip v-for="searched in searchArray" :key="searched" label outline color="primary" @click="lastSearched = searched, getUser(searched)">{{ searched }}</v-chip>
          </transition-group>
          </p>
        <input autocomplete="off" id="smoothTransition" v-model="user" placeholder="User" :class="[info && !userNotFound ? 'inputSmall' : 'input']" >
        <v-btn depressed outline dark v-on:click="getUser(user), page=0" :class="[info && !userNotFound ? 'mt-0' : 'mt-5']">Search</v-btn>
      </v-form>
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
            <v-dialog lazy v-model="dialog" max-width="600" v-if="playlist && cardId == item.id">
              <v-card>
              <v-text-field
              class="mx-5 pt-3"
              v-model="search"
              append-icon="search"
              label="Search eg, track or tuning."
              single-line
              hide-details
              >           
              </v-text-field> 
              <v-data-table
                class="tableElem"
                :headers="headers"
                :items="playlist"
                :loading="loadingPlaylist"
                :search="search"
                :pagination.sync="pagination"
                :rows-per-page-items="[10]"
                hide-actions
              >
                <v-progress-linear slot="progress" color="purple" indeterminate></v-progress-linear>
                <template slot="items" slot-scope="props">
                  <td class="font-weight-bold">{{ props.item.artist }}</td>
                  <td class="text-xs-right">{{ props.item.track }}</td>
                  <td class="text-xs-right">{{ props.item.tuning | tuning }}</td>
                  <td class="text-xs-right">
                    <v-btn 
                    v-if="props.item.url" 
                    depressed outline light 
                    style="margin-top:1rem;margin-bottom:1rem;" 
                    :href="props.item.url" 
                    target="!blank">
                      Tab
                    </v-btn>
                    <div class="text-xs-center" v-else-if="props.item.url == false">No tab :(</div>
                    <div v-else>
                    <v-btn
                    :loading="(loadingTab == props.item)"
                    depressed outline light 
                    style="margin-top:1rem;margin-bottom:1rem;" 
                    v-on:click="getTab(props.item.artist, props.item.track, props.item), tabItem = props.item">
                      Get Tab
                    </v-btn>
                    </div>
                  </td>
                </template>
                <v-alert slot="no-results" :value="true" style="color:black;" icon="warning">
                  Your search for "{{ search }}" found no results.
                </v-alert>
                </v-data-table>
                <div class="text-xs-center pt-3" v-if="!loadingPlaylist">
                  <v-pagination v-model="pagination.page" circle color="purple" :length="pages"></v-pagination>
                </div>
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
      loadingTab: null,
      tabItem: null,
      currentLoader: null,
      lastSearched: null,
      search: "",
      pagination: {},
      headers: [
        {
          text: "Artist",
          align: "left",
          value: "name"
        },
        { text: "Track", align: "left", value: "track" },
        { text: "Tuning", value: "tuning" },
        { text: "Tab", value: "tab", sortable: false }
      ],
      searchArray: []
    };
  },
  filters: {
    tuning: function(str) {
      if (str == null || str == "") {
      } else {
        return str
          .split("")
          .reverse()
          .join("")
          .toUpperCase();
      }
    }
  },
  mounted() {
    this.amountofTabs();
    if (localStorage.getItem("searchedUser")) {
      this.getlocalStorage();
    }
  },
  computed: {
    pages() {
      if (this.playlist != null) {
        return Math.ceil(
          this.pagination.totalItems / this.pagination.rowsPerPage
        );
      }
    }
  },
  methods: {
    amountofTabs() {
      const countURL = "https://stark-beyond-77127.herokuapp.com/spotify/count";
      //const countURL = "http://localhost:3000/spotify/count";
      axios.get(countURL).then(response => {
        this.total = response.data.total;
        this.tabs = response.data.tabs;
      });
    },
    getlocalStorage() {
      let localStorageUsers = JSON.parse(localStorage.getItem("searchedUser"));
      this.searchArray = localStorageUsers;
    },
    getUser(user) {
      this.userNotFound = false;
      if (user == null && this.lastSearched != null) {
        user = this.lastSearched;
      }
      if (user != null && user != "") {
        if (this.searchArray.includes(user)) {
          // already exists
        } else if (this.searchArray.length <= 4) {
          this.searchArray.push(user);
        } else {
          this.searchArray.unshift(user);
          this.searchArray.pop();
        }
        localStorage.setItem("searchedUser", JSON.stringify(this.searchArray));
        const userURL = "https://stark-beyond-77127.herokuapp.com/spotify/user";
        //const userURL = "http://localhost:5000/spotify/user";
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
        this.playlist = [];
        this.loadingPlaylist = true;
        const playlistURL = "https://stark-beyond-77127.herokuapp.com/spotify/playlist";
        //const playlistURL = "http://localhost:5000/spotify/playlist";
        let playlistId = arg.id;
        const playlistJSON = {
          id: playlistId
        };
        axios
          .post(playlistURL, playlistJSON)
          .then(response => {
            this.alreadyLoading = false;
            this.loadingPlaylist = false;
            this.playlist = response.data;
            this.pagination.totalItems = this.playlist.length;
          })
          .catch(err => {
            console.log("Too many requests.");
          });
      } else {
        // Already loading tracks
      }
    },
    getTab(artist, track, item) {
      const tabURL = "https://stark-beyond-77127.herokuapp.com/spotify/gettab";
      //const tabURL = "http://localhost:5000/spotify/gettab";
      this.loadingTab = item;
      let itemIndex = this.playlist.indexOf(item);
      const tabJSON = {
        artist: artist,
        track: track
      };
      axios.post(tabURL, tabJSON).then(response => {
        this.loadingTab = null;
        let tuning = response.data[0].tuning;
        let url = response.data[0].url;
        let editedItem = {
          ...this.playlist[itemIndex],
          ...{ tuning: tuning, url: url }
        };
        this.playlist.splice(itemIndex, 1, editedItem);
      });
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
  padding-top: calc(17vh - 4em);
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
  box-shadow: 0 4px 5px rgba(0, 0, 0, 0) !important;
}
.tableElem {
  width: 100%;
}
@media only screen and (max-width: 550px) {
  .input {
    font-size: 8em;
  }
  .inputSmall {
    font-size: 4em;
  }
}
</style>
