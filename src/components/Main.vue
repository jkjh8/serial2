<template>
    <v-container>
        <v-card>
            <v-data-table :headers="headers" :items="items" :sort-by="sortby" :sort-desc="sortdesc" dense>
                <template v-slot:item.createAt="{ item }">
                    {{ item.createAt.toLocaleString() }}
                </template>
                <template v-slot:item.msg="{ item }">
                    <!-- {{ toHexString(item.msg) }} -->
                    {{ item.msg }}
                </template>
            </v-data-table>
        </v-card>
    </v-container>
</template>

<script>
// const path = require('path')
const Datastore = require('nedb-promises')
let db = Datastore.create('/path/to/db.db')

export default {
    data() {
        return {
            sortby: 'createAt',
            sortdesc: true,
            headers: [
                {value:'createAt', text: '시간', width: '180px'},
                {value:'protocol', text: '프로토콜', width: '100px'},
                {value: 'from', text: '발신', width: '100px'},
                {value: 'msg', text: '값'}
            ],
            items : [],
        }
    },
    mounted() {
        // this.list()

        console.log(this.items)
        this.$eventBus.$on('addMsg', (id, from, msg) => {
            // console.log('in start')
            this.items.push({
                createAt: new Date(),
                protocol: id,
                from: from,
                msg: msg
            })
            // this.adddb()   
        })
    },
    methods: {
        adddb () {
            // console.log(this.items[0])
            const d = db.insert(this.items[0])
            // console.log(this.items[0])
            console.log(d)
            this.listdb()
        },
        listdb() {
            this.items = db.find()
            console.log(this.items)
        },
        toHexString(byteArray) {
            return Array.from(byteArray, function(byte) {
                return ('0' + (byte & 0xFF).toString(16)).slice(-2);
            }).join(',')
        }
    }
}

</script>

<style>
</style>