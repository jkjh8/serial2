<template>
    <v-footer app color="primary" dark>
        <v-container>
            <v-row>
                <v-col cols="10">
                    <v-text-field class="footer-text" hide-details dense></v-text-field>
                </v-col>
                <v-col cols="2">
                    <v-btn class="footer-btn" text>
                        SEND
                    </v-btn>
                </v-col>
            </v-row>                      
        </v-container>
    </v-footer>
</template>



<style>
  .footer-text {margin-left: 30px; margin-right: 0px; padding: 0px;}
  .footer-btn {margin-right: 30px; margin-left: 0px; padding: 0px;}
</style>