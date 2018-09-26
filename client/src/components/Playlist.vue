<template>
    <div>
    <v-container fluid fill-height>
    <v-layout justify-center>
    <v-flex xs12 sm10 md8 lg6 xl-6>
        <p>{{ number }}</p>
    </v-flex>
    </v-layout>
    </v-container>
    </div>
</template>
<script>
import Main from '../components/Main.vue'

    export default {
        name: 'Playlist',
        data() {
            return {
                number: Main.number
            }
        },
        components: {
            Main
        },
        created() {
            
        }
    }
</script>

<style scoped>

</style>