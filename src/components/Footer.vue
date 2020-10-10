<template>
    <v-footer app color="blue-grey darken-2" dark>
        <v-container>
            <v-row>
                <v-col cols="10">
                    <v-text-field 
                    class="footer-text" 
                    @keyup.enter="sendtextevent()"
                    v-model="sendtext"
                    hide-details
                    dense>
                    </v-text-field>
                </v-col>
                <v-col cols="2">
                    <v-btn class="footer-btn" @click="sendtextevent" text>
                        SEND
                    </v-btn>
                </v-col>
            </v-row>                      
        </v-container>
    </v-footer>
</template>

<script>
const ipcRenderer = window.require('electron').ipcRenderer;
export default {
    data() {
        return {
            sendtext: '',
        }
    },
    methods: {
        sendtextevent: function () {
            console.log(this.sendtext)
            ipcRenderer.send('sendMsg', this.sendtext)
        }
    }
}

</script>

<style>
  .footer-switch {height: 10px; margin: 0px; padding: 0px;}
  .footer-text {margin-left: 30px; margin-right: 0px; padding: 0px;}
  .footer-btn {margin-right: 30px; margin-left: 0px; padding: 0px;}
</style>