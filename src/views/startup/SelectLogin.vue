<template>
<div class="text-white buttons mt-28 select-none">
    <div @click="login('facebook')" class="facebook flex justify-left items-center h-14">
        <div class="ml-4"><img class="image" src="@/assets/startup/facebook.png" /></div>
        <div class="flex-1">
            <div class="flex justify-center items-center">Sign in with Facebook</div>
        </div>
    </div>
    <div @click="login('google')" class="google flex justify-left items-center h-14 mt-8">
        <div class="ml-4"><img class="image" src="@/assets/startup/google.png" /></div>
        <div class="flex-1">
            <div class="flex justify-center items-center">Sign in with Google</div>
        </div>
    </div>
    <div @click="login('apple')" class="apple flex justify-left items-center h-14 mt-8">
        <div class="ml-4"><img class="image" src="@/assets/startup/apple.png" /></div>
        <div class="flex-1">
            <div class="flex justify-center items-center">Sign in with Apple</div>
        </div>
    </div>
    <div class="flex justify-center items-center mt-3 text-black seperator">
        <div class="line"></div>
        <div class="m-4">OR</div>
        <div class="line"></div>
    </div>
    <div class="flex justify-between mt-3">
        <div @click="show('register')" class="flex justify-left items-center h-14 km">
            <div class="ml-4 image">K</div>
            <div class="flex-1">
                <div class="flex justify-center items-center">Sign Up</div>
            </div>
        </div>
        <div @click="show('login')" class="flex justify-left items-center h-14 km-i">
            <div class="ml-4 image">K</div>
            <div class="flex-1">
                <div class="flex justify-center items-center">Sign In</div>
            </div>
        </div>                    
    </div>
</div>
</template>

<script>
/* eslint-disable */
import { BackendConfig, RUNNING_NATIVE } from '@/config'
import { FacebookLogin, FacebookLoginResponse } from '@capacitor-community/facebook-login';
export default {
    name: "SelectLogin",
    components: {},
    data: function() {
        return {};
    },
    mounted: function() {},
    methods: {
        async login() {
            if(RUNNING_NATIVE()) {
                const FACEBOOK_PERMISSIONS = ['email', 'user_birthday', 'user_photos', 'user_gender'];
                const fbResult = JSON.parse(JSON.stringify(await FacebookLogin.login({ permissions: FACEBOOK_PERMISSIONS })));
                if (fbResult.accessToken) {
                    try {
                        const result = await this.$http.post(BackendConfig.backendUrl() + "/auth/facebook", {
                            access_token: fbResult.accessToken.token
                        });
                        const json = result.data;
                        console.log(json);
                        if(json.status == "success"){
                            this.$store.user.id = json.user_id;
                            this.$router.replace("/view/scale");
                        } else {
                            this.$notify({ title: 'Unable to Login', text: 'Backend eror, please try again later.', type: "error"});
                        }
                    } catch(e) {
                        console.log(e)
                    }                    
                } else {
                    this.$notify({ title: 'Unable to Login', text: 'Could not connect to Account, please try again.', type: "error"});
                }              
            }
            // login via browser, for normal debugging purposes
            else {
                this.$auth.authenticate('facebook').then(async (data) => {
                    try {
                        const result = await this.$http.post(BackendConfig.backendUrl() + "/auth/facebook", {
                            access_token: data.access_token
                        });
                        const json = result.data;
                        console.log(json);
                        if(json.status == "success"){
                            this.$store.user.id = json.user_id;
                            this.$router.push("/view/scale");
                        } else {
                            this.$notify({ title: 'Unable to Login', text: 'Backend eror, please try again later.', type: "error"});
                        }                        
                    } catch(e) {
                        console.log(e)
                    }
                    
                });
            }
        },
        show: function(page) {
            this.$notify({ title: 'my titla', text: 'Hello user!', type: "warn"})
            //this.$router.replace(page)
        }      
    },
	computed: {
	}
};
</script>

<style lang="scss" scoped>
.buttons {
    font-family: Arial;
    font-weight: 600;
    font-size: 19px;
    .seperator {
        font-family: Roboto;
        font-weight: 300;
        font-size: 18px;
        .line {
            border-top: 1px solid black;
            width: 100%;
        }
    }

    .facebook {
        background-color: #1877F2;
        .image {
            width: 24px;
            height: 24px;
        }
        border-radius: 10px;
    }

    .google {
        background-color: white;
        border: 1px solid lightgray;
        color: rgba(0, 0, 0, 0.54);
        .image {
            width: 24px;
            height: 24px;
        }
        border-radius: 10px;
    }

    .apple {
        background-color: black;
        .image {
            width: 24px;
            height: 24px;
        }
        border-radius: 10px;
    }

    .km {
        width: 46%;
        background-color: #F12C2C;
        color: white;
        border-radius: 10px;
        .image {
            font-family: Boldini;
            font-size: 34px;
            margin-top: -15px;
        }
    }
    .km-i {
        width: 46%;
        background-color: white;
        color: #F12C2C;
        border: 1px solid #F12C2C;
        border-radius: 10px;
        .image {
            font-family: Boldini;
            font-size: 34px;
            margin-top: -15px;            
        }        
    }
}
</style>

chat ass es