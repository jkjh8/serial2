<template>
    <v-navigation-drawer app v-model="drawer">
        <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            Application
          </v-list-item-title>
          <v-list-item-subtitle>
            subtext
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
        <v-divider/>
        <v-list dense>
            <v-list-group
                v-for="(item, i) in items"
                :key= "i"
                :prepend-icon="item.icon"
                v-model="item.active"
                no-action
            >
                <template v-slot:activator>    
                    <v-list-item-content>
                        <v-list-item-title>
                            {{ item.title }}
                            <v-icon v-if='item.online' size=16 color='teal darken-2'>mdi-wifi</v-icon>
                        </v-list-item-title>                       
                    </v-list-item-content>
                </template>

                <v-list-item
                    v-for="(subItem, j) in item.items"
                    :key="j"
                    >
                    <v-list-item-content v-if="i === 0">
                        <v-select
                            :label="subItem.title"
                            :items="subItem.items"
                            :v-bind="subItem.model"
                            @change="changeValue(i,j,value=$event)"
                            hide-details
                            dense/>
                    </v-list-item-content>

                    <v-list-item-content v-else>
                        <v-text-field
                        :label="subItem.title"
                        v-model="subItem.model"
                        :placeholder="subItem.placeholder"
                        @change="changeValue(i,j,value=$event)"
                        hide-details
                        dense/>
                    </v-list-item-content>
                </v-list-item>

                <v-list-item>
                    <v-list-item-title>Online</v-list-item-title>
                    <v-spacer/> 
                    <v-switch :v-model="item.model" v-on:change="goOnline(i,value=$event)"></v-switch>
                </v-list-item>
            </v-list-group>
        </v-list>
    </v-navigation-drawer>
</template>

<script>
let commValue = new Array(5);
for (let i = 0;i< commValue.length; i++) {
  commValue[i] = new Array(2);
}

export default {
    props: ['drawer','onlineStatus'],
    methods: {
        goOnline: function (id) {
          console.log(commValue[id][0],',',commValue[id][1])
          let v1 = commValue[id][0]
          let v2 = commValue[id][1]
          if (v1===''||v2===''||v1===undefined||v2===undefined||v1===null||v2===null) {
            this.$eventBus.$emit('snackBarAct', "error")
            console.log(this.serial)
            this.serial.class = "info"
          } else {
            this.$eventBus.$emit('goOnlineValue', id)
          }
        },
        changeValue: function(i,j,value) {
           console.log(i+','+j+','+ value)
           commValue[i][j] = value
           console.log(commValue)
        }

    },
    mounted() {
        this.$eventBus.$on('serialOnlineRt', (value) => {
            this.items[0].online = value
            // console.log(this.items[0])
        })
    },
    data () {
      return {
        items: [
        // 시리얼
          {
            title: 'Serial',
            online: false,
            method: 'SerialOnline(item.value)',
            model: 'serial',
            icon: 'mdi-serial-port',
            items: [
              { 
                title: 'COM',
                model: 'Serial1',
                items: ['COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8']
              },
              {
                title: 'BUAD',
                model: 'Serial2',
                items: ['9600','14400','19200','28800','38400','57600','115200']
              },
            ],
          },
        //TCP 서버
          {
            title: 'TCP Server',
            online: false,
            icon: 'mdi-server',
            items: [
              { 
                title: 'IP',
                placeholder: 'localhost'
              },
              {
                title: 'PORT',
              },
            ],
          },
          //TCP 클라이언트
          {
            title: 'TCP Client',
            online: false,
            icon: 'mdi-ethernet',
            items: [
              { 
                title: 'IP',
              },
              {
                title: 'PORT',
              },
            ],
          },
          //UDP 서버
          {
            title: 'UDP Server',
            online: false,
            icon: 'mdi-server-network',
            items: [
              { 
                title: 'IP',
                placeholder: 'localhost',
              },
              {
                title: 'PORT',
              },
            ],
          },
          //UDP 클라이언트
          {
            title: 'UDP Client',
            online: false,
            icon: 'mdi-network',
            items: [
              { 
                title: 'IP',
              },
              {
                title: 'PORT',
              },
            ],
          },
        ],
      }
    },
}
</script>

<style>
    .v-text-field input{
        font-size: 0.8em;
    }
    .v-text-field label{
        font-size: 0.8em;
    }
    .v-select__selections {
        font-size: .8em;
    }
</style>