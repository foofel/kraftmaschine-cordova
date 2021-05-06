<template>
<div class="fill-parent">
    <HeadlineView headlineText="Account">
        <div class="fill-parent center-in-rows">
            <div class="content-holder">
                <table class="table">
                    <tbody>
                        <tr>
                            <td class="label noselect" @click="onToggleValidation()">Alias</td>
                            <td class="grow "><input class="input" type="text" placeholder="alias" :value="model.alias" :disabled="true"/></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td class="desc-text" colspan="2">This is your account name, it is unique and identifies you. It cannot be changed.</td>
                        </tr>
                        <tr>
                            <td class="label noselect">Name</td>
                            <td class="grow "><input class="input" type="text" value="" placeholder="name" v-model="model.name"/></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td class="desc-text noselect" colspan="2">If you want to post your real name. This is optional but a nice addition :)</td>
                        </tr>                
                        <tr>
                            <td class="label noselect">Email</td>
                            <td class="grow "><input class="input" type="text" value="" placeholder="recovery email" v-model="model.email"/></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td class="desc-text noselect" colspan="2">Only used to allow account reset</td>
                        </tr>
                        <tr v-if="expertMode">
                            <td class="label noselect">Secret</td>
                            <td class="grow uuid-input-container ">
                                <div v-if="!validUuid(model.password)" class="invalid-uuid noselect">The secret must be in the UUID format</div>
                                <input class="input" type="text" value="" placeholder="00000000-0000-0000-0000-000000000000" v-model="model.password" />
                            </td>
                        </tr>
                        <tr v-if="expertMode">
                            <td></td>
                            <!--td class="desc-text" colspan="2">This is your authentication token, dont share it and keep it private! To backup/restore an account just save it somewhere secure. (restart app to take effect)</td-->
                            <td class="desc-text noselect" colspan="2">This is your authentication token, dont share it and keep it private! Changing this changes your active account, <span class="important">save it before you change it!</span></td>
                        </tr>
                    </tbody>
                </table>
                <div class="button-container">
                    <Button class="left " @onClick="discard">Discard</Button>
                    <Button class="right " @onClick="save" :disabled="!validUuid(model.secret)" >Save</Button>
                </div>
            </div>
            <div class="show-expert-mode clickable center-in-rows" @click="onToggleExpertMode()">
                <i class="fas fa-cogs"></i>
            </div>
            <div class="version">App Version: {{getVersion()}}</div>
        </div>
    </HeadlineView>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ConfigFile } from '../../core/storageinterface';
import { EasyRemoteApiHelpers, clearAllCookies } from '../../core/util';
import Button from '@/components/Button.vue'
import { GlobalConfig, AppVersion } from '../../config';
import { VueNavigation } from '../vuenavigation';
import HeadlineView from '@/components/HeadlineView.vue'

@Component({ 
    components: {
        Button,
        HeadlineView
    }
})
export default class AccountOptions extends VueNavigation {
    model = {
        alias: "",
        name: "",
        email: "",
        password: ""
    }
    cfg: ConfigFile = this.$root.$data.cfg;
    enableUuidValidation= true;
    backend = this.$root.$data.backend;
    validateRegex = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
    expertMode = false;
    constructor() {
        super();
    }
    mounted() {
        this.load();
    }

    load() {
        this.model.alias = this.cfg.userName;
        this.model.name = this.cfg.displayName;
        this.model.email = this.cfg.email;
        this.model.password = this.cfg.password;
    }

    onToggleExpertMode() {
        this.expertMode = !this.expertMode;
        if(!this.expertMode) {
            this.enableUuidValidation = true;
        }
    }

    onToggleValidation() {
        if(this.expertMode) {
            this.enableUuidValidation = !this.enableUuidValidation;
        }
    }

    save = async () => {
        if(this.expertMode) {
            this.cfg.password = this.model.password;
        }
        const result = await EasyRemoteApiHelpers.updateUserData(this.backend, this.model.name, this.model.email, null);
        if(result) {
            this.cfg.userName = result[0].username;
            this.cfg.displayName = result[0].displayname;
            this.cfg.email = result[0].email;
            clearAllCookies();
            window.location.reload(true);
        } else {
            console.log("unable to update user");
        }
    }

    validUuid(uuid: string) {
        if(this.expertMode) {
            if(this.enableUuidValidation) {
                return this.validateRegex.test(uuid)
            }
            return true;
        } else  {
            return true;
        }
    }

    discard = () => {
        this.load();
    }

    getVersion() {
        return AppVersion.versionString();
    }
}
</script>

<style scoped lang="scss">
.headline {
    font-size: 2em;
    font-weight: 600;
    margin: 10px;
}

.content-holder {
    width: 90%;
    height: 90%;
    padding-bottom: 20px;
    overflow: hidden;
    overflow-y: auto;
}

.table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    //margin-bottom: 50px;
}

.grow {
    //width: 100%;
}

.label {
    white-space: nowrap;
    height: 30px;
    width: 50px;
}

.input {
    width: calc(100% - 10px);
    border-radius: 3px;
    margin: 3px;
    border: 1px solid gray;
    padding: 2px;
    height: 25px;
}
.uuid-input-container {
    position: relative;
}

.invalid-uuid {
    margin-bottom: -3px;
    padding-left: 5px;
    color: red;
    font-size: 0.75em;
    //position: relative;
    //top: 50%;
    //transform: translate(0, -50%);
    //right: 10px;
}

.important {
    color: red;
    font-weight: bold;
}

.left {
    float: left;
}

.right {
    float: right;
}
.desc-text {
    font-size: 0.75em;
    padding-left: 5px;
    padding-right: 5px;
    vertical-align: top;
    padding-bottom: 15px;
}

.button-container {
    position: relative;
    margin-top: 10px;
    height: 40px;
    width: 100%;
}
.show-expert-mode {
    position:absolute;
    bottom: 0;
    left: 0;
    width: 35px;
    height: 35px;
    color: gray;
}
.version{
    position: absolute;
    bottom: 5px;
    right: 5px;
}
</style>
