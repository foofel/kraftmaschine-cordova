<template>
<div class="root-container maximize" ref="mainView">
    <div class="center-in-rows fill-parent">
        <div class="scroller">
            <div class="content center-in-columns">
                <!--div style="width: 250px; height: 480px; background-color: black; border: 2px dashed red;"></div-->
                <div class="startup-content" ref="startupContent">
                    <div v-if="showBackendError" class="center-in-rows maximize">
                        <div class="backend-error-text">
                            <p>Backend error, unable to start app!</p>
                            <p>Please try again later.</p>
                        </div>
                        <Button @onClick="(evt) => reloadApp()">
                            Retry
                        </Button>
                    </div>            
                    <div v-else-if="showBackendVersionMismatch" class="version-display">
                        <p><b><h2>Backend Mismatch</h2></b></p>
                        <div>App Backend: {{versionState.requiredBackendVersion}}</div>
                        <div>Server Backend: {{versionState.backendVersion}}</div>
                    </div>
                    <div v-else-if="showCreateAccount" class="create-account">
                        <div class="center-in-rows">
                            <div v-if="showChangeSecret || showExpertMode" class="center-in-rows secret-container">
                                <div class="headline-secret" @click="subEnableUuidValidation()">
                                    <div v-if="model.secret === ''">Set Secret</div>
                                    <div v-if="model.secret !== ''">Change Secret</div>
                                </div>
                                <div class="input-container secret-input">
                                    <div v-if="!validUuid(model.secret)" class="invalid-uuid noselect">The secret must be in the UUID format</div>
                                    <input 
                                        class="input-field" 
                                        type="text" 
                                        placeholder="00000000-0000-0000-0000-000000000000" 
                                        v-model="model.secret"
                                        @keyup.enter="(event) => saveSecretClicked()"
                                    />
                                </div>
                                <div v-if="showChangeSecret" class="desc-text">
                                    It seems like you already have an account but can't login, 
                                    this means your secret is wrong or your account was banned/deleted. If you changed it recently, 
                                    try to revert the change. 
                                    <span style="color:red"><b>If you overwrite this without having a copy of your secret you will loose your account!</b></span>
                                </div>
                                <div>
                                    <Button @onClick="(evt) => saveSecretClicked()" :disabled="!validUuid(model.secret)">
                                        Save Secret
                                    </Button>
                                </div>
                            </div>
                            <div class="spacer" v-if="showChangeSecret || showExpertMode"></div>
                            <div class="headline-account">Create New Account</div>
                            <div class="input-container center-in-columns">
                                <input 
                                    class="name-input" 
                                    :class="{good: isGoodIcon(), bad: isBadIcon()}" 
                                    type="text" 
                                    value="" 
                                    @input="(evt) => validateUsername(evt.target.value)"
                                    @keyup.enter="(event) => createAccountClicked()" 
                                    placeholder="your username"/>
                            </div>
                            <div class="desc-text" v-if="showChangeSecret">
                                <span style="color:red"><b>If you create a new account without having a backup of your secret, you can not access your previous account anymore!</b></span>
                            </div>                
                            <Button :disabled="usernameExists || selectedUsername === ''"  @onClick="(evt) => createAccountClicked()">
                                Create Account
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-if="showCreateAccount && !showChangeSecret" class="show-expert-mode clickable center-in-rows" @click="onToggleExpertMode()">
        show expert mode
    </div>
    <div ref="splash" class="splash splashbg fill-parent center-in-rows invis">
        <div class="splashcontent center-in-rows">
            <div>
                <div class="splash-headline-container">
                    <div class="splash-headline">KraftMaschine</div>
                    <div class="subtitle">By Twin Peaks</div>
                </div>
            </div>
            <div class="greeting" v-if="displayName != ''">Welcome <span class="name">{{displayName}}</span> :D</div>
            <div class="greeting" v-else>&nbsp;</div>
            <img class="logo" src="@/assets/bblogo.png" alt="logo" />
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ConfigFile, SaveConfigObject } from '@/core/localstore';
import { RemoteAPI, LocalSaveUploader, EasyRemoteApiHelpers, clearAllCookies } from '@/core/util'
import { GlobalConfig, AppVersion, RequiredBackendVersion } from '@/config'
import { UserData } from '@/core/user'
import { GlobalStore } from '../main';
import Button from '@/components/Button.vue'

@Component({
    components: {
        Button
    }
})
export default class StartupView extends Vue {
    backend: RemoteAPI = this.$root.$data.backend;
    cfg: ConfigFile = this.$root.$data.cfg;
    //backendVersion:string = "";
    // visible (error) states and setup
    showCreateAccount = false;
    showBackendVersionMismatch = false;
    showChangeSecret = false;
    showBackendError = false;
    setupComplete = false;
    // account creation stuff
    timeout: any = null;
    usernameExists = false;
    selectedUsername = "";
    showExpertMode = false;
    enableUuidValidation = 3;
    versionState = {
        appVer: AppVersion.versionString(),
        requiredBackendVersion: RequiredBackendVersion.versionString(),
        backendVersion: ""
    }
    validateRegex = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
    model = {
        secret: ""
    }
    // splash stuff
    displayName = ""
    constructor() {
        super();
    }

    async mounted()  {
        this.executeSetupSequence();
    }

    reloadApp() {
        clearAllCookies();
        window.location.reload(true);
    }

    onToggleExpertMode() {
        this.showExpertMode = !this.showExpertMode;
    }

    subEnableUuidValidation() {
        this.enableUuidValidation--;
    }

    async validateUsername(name: string) {
        this.selectedUsername = name
        this.usernameExists = true;
        if(name) {
            const response = await EasyRemoteApiHelpers.userExists(this.backend, this.selectedUsername);
            if(response.result.status === 200) {
                if(this.timeout) {
                    clearTimeout(this.timeout);
                }
                this.timeout = setTimeout(() => {
                    this.usernameExists = response.userExists;
                    this.timeout = null;
                }, 250);
            } else {
                this.showBackendError = true;
            }            
        }
    }

    async createAccountClicked(evt: any) {
        const result = await EasyRemoteApiHelpers.createAccount(this.backend, this.selectedUsername);
        if(result) {
            this.cfg.secret = result.secret;
            this.cfg.alias = result.alias;
            SaveConfigObject(this.cfg);
            console.log(`account '${this.cfg.alias}' created (key:${this.cfg.secret}, PRIVATE do not share!)`);
            const authPromise = await EasyRemoteApiHelpers.authenticate(this.backend, this.cfg.secret);
            if(authPromise.result.status !== 200) {
                this.showBackendError = true;
                //this.reloadApp();
            } else {
                this.redirectToMain();
            }
        } else {
            console.log("unable to create account: " + result);
        }
    }

    async saveSecretClicked(evt: any) {
        this.cfg.secret = this.model.secret;
        SaveConfigObject(this.cfg);
        this.reloadApp();
    }

    async executeSetupSequence() {
        this.displayName = this.cfg.alias;
        this.model.secret = this.cfg.secret;
        this.startIntro();
        const version = await EasyRemoteApiHelpers.getVersion(this.backend);
        if(!version) {
            this.showBackendError = true;
            this.setupComplete = true;
        }
        // make the main element visible after we received the version, otherwise
        // we get stupid flickering
        const mainElem = this.$refs.mainView as HTMLElement;
        mainElem.style.visibility = "visible";
        if(version && version.versionNumber !== RequiredBackendVersion.versionNumber()) {
            this.versionState.backendVersion = version.versionString;
            this.showBackendVersionMismatch = true;
            console.log("INVALID VERSION, PLEASE UPDATE APP");
        }
        // if we have an id its not the first login
        if(this.cfg.secret !== "") {
            this.cfg.options.firstLogin = false;
            SaveConfigObject(this.cfg);
        }
        //TODO: do something if the first login thingi should be used
        // ...
        if(this.cfg.secret === "") {
            this.showCreateAccount = true;
            this.setupComplete = true;
            return;
        }
        const authPromise = await EasyRemoteApiHelpers.authenticate(this.backend, this.cfg.secret);
        //let initData = await EasyRemoteApiHelpers.getInitialData(this.backend);
        if(authPromise.result.status === 200/* && initData !== []*/) {
            this.cfg.id = authPromise.data.id;
            this.cfg.alias = authPromise.data.alias;
            this.cfg.email = authPromise.data.email;
            this.cfg.name = authPromise.data.name;
            SaveConfigObject(this.cfg);
            this.displayName = this.cfg.alias;
            console.log(`authentication successfull, hello ${this.cfg.alias} :)`);
            GlobalStore.localSaveUploader.uploadLocalSaves();
            /*GlobalStore.staticData = {
                boards: initData as 
            }*/
        } else if(authPromise.result.status === 401) {
            this.showCreateAccount = true;
            this.showChangeSecret = true;
            console.log(`authentication failed, userKey:'${this.cfg.secret}' (this key is PRIVATE, do not share)`);
        } else {
            this.showBackendError = true;
        }
        this.setupComplete = true;
    }

	sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async startIntro() {
        const splash = this.$refs.splash as HTMLElement;
        const content = this.$refs.startupContent  as HTMLElement;

        // inital sleep is needed otherweise we wont get the css transition
        if(this.cfg.options.skipSplash) {
            // splash.style.display = "none";
        } else {
            await this.sleep(100);
            splash.classList.add("fadein");
            await this.sleep(2000);
        }
        
        const interval = setInterval(async () => {
            if(!this.setupComplete) {
                return;
            }
            clearInterval(interval);
            splash.classList.add("fadeout");
            await this.sleep(250);
            splash.style.display = "none";            
            // wait for intro complete
            if(this.showBackendError || this.showCreateAccount || this.showBackendVersionMismatch || this.showChangeSecret) {
                content.classList.add("fadein");
            } else {
                this.redirectToMain();
            }
        }, 100);
	}

	get name() {
		return this.cfg.alias;
    }
    
    get hasName() {
        const alias = this.cfg.alias;
        const hn = alias != ''; // eslint-disable-line eqeqeq
        console.log(hn);
        return hn;
    }

    get getSecret() {
        return this.cfg.secret;
    }

    isGoodIcon() {
        return !this.usernameExists && this.selectedUsername !== ""
    }
    isBadIcon() {
        return this.usernameExists && this.selectedUsername !== "";
    }

    redirectToMain() {
        this.$router.replace("view/scale");
        //TODO: if we are on a first run, push device selection screen
    }

    validUuid(uuid: string) {
        //if(this.showExpertMode) {
            if(this.enableUuidValidation > 0) {
                return this.validateRegex.test(uuid)
            }
            return true;
        /*} else  {
            return true;
        }*/
    }    
}
</script>

<style scoped lang="scss">
.root-container {
	height: 100vh;
    width: 100vw;
}

.startup-content {
    opacity: 0;
    transition: 0.250s opacity;
}

.content {
    width: 90vw;
}

.startup-content.fadein {
	opacity: 1;
}
.scroller {
    overflow: hidden;
    overflow-y:scroll;
}

.create-account {
    margin-bottom: 50px;
    margin-top: 50px;
    width: 90vw;
    .login-error {
        .error {
            font-size: 1.5em; 
            font-weight: bolder;
        }
        .desc {
            margin-top: 20px;;
        }
        margin-bottom: 50px;
    }
}

////////////////////////////////////////////////

.version-display {
    text-align: center;
}
.spacer {
    width:90%;
    height: 1px;
    background-color: lightgray;
    margin: 5px;
    margin-top: 30px;
}
.headline-secret {
    font-weight: bolder;
    font-size: 1.5em; 
    margin: .75em 0;
    margin-top: 0px;
}
.headline-account {
    font-weight: bolder;
    font-size: 1.5em; 
    margin: .75em 0;
    margin-top: 20px;
}
.desc-text {
    font-size: 0.75em; 
    margin-bottom: 20px;
    width: 90%;
    text-align: center;
}
.input-container {
    position: relative;
    margin-bottom: 20px;
    width: 90%
}
.input-field, .name-input {
    border-radius: 3px;
    border: 1px solid gray;
    padding: 2px;
    height: 25px;
    width: 100%;
    box-sizing:border-box;
}
.name-input.good {
    background: url(~@/assets/name_good.svg) no-repeat right 5px center;
    background-size: 20px 20px;
}
.name-input.bad {
    background: url(~@/assets/name_bad.svg) no-repeat right 5px center;
    background-size: 20px 20px;
}
.retry-button {
    width: 150px;
    height: 40px;
}

.backend-error-text {
    text-align: center;
    font-weight: bolder;
}

.secret-container {
    width: 100%;
}

////////////////////////////////////////////////

.splash {
	position: absolute;
	top: 0;
	left: 0;
	background-color: white;
	opacity: 0;
	transition: 0.25s opacity;
	z-index: 2;
}
.splash.fadein {
	opacity: 1;
}
.splash.fadeout {
	transition: 0.25s opacity;
	opacity: 0;
}
.splashcontent {
	width: 300px;
}
.logo {
	border-radius: 40px;
	width: 300px;
	height: 300px;
	color: #222222;
}
.splash-headline-container {
	position: relative;
}
.splash-headline {
	font-size: 3.5em;
}
.subtitle {
	position:absolute;
	font-size: 0.75em;
	bottom: -1px;
	right: 0px;
}
.greeting {
	color: gray;
	margin-top: 15px;
	margin-bottom: 30px;
}
.greeting:after
{
    content: '.';
    visibility: hidden;
}
.name {
	color: black;
	font-weight: 500;
}
.show-expert-mode {
    position:absolute;
    top: 0;
    width: 100%;
    background-color: lightgray;
    color: gray;
    //border-radius: 5px;
    height: 35px;
}
.secret-input {
    position: relative;
}
.invalid-uuid {
    padding-left: 5px;
    color: red;
    font-size: 0.75em;
}
@media (orientation:landscape) {
	.splash-headline {
		font-size: 2.5em;
	}
	.logo {
		border-radius: 40px;
		width: 200px;
		height: 200px;
	}
	.greeting {
		color: gray;
		margin-top: 5px;
		margin-bottom: 20px;
	}	
	.subtitle {
		position:absolute;
		font-size: 0.57em;
		bottom: -2px;
		right: 2px;
	}	
}
</style>