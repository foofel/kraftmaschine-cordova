<template>
<div>
    <div class="register mt-28 flex flex-col gap-4">
        <input class="h-14 rounded-xl w-full" type="text" placeholder="Email" />
        <input class="h-14 rounded-xl w-full gap-4" type="text" placeholder="Password" />
    </div>
    <div class="flex justify-between mt-16 km-btns select-none">
        <div @click="show('select')" class="flex justify-left items-center h-14 km-default">
            <div class="ml-4 image">&laquo;</div>
            <div class="flex-1 mr-6">
                <div class="flex justify-center items-center">
                    Back
                </div>
            </div>
        </div>
        <div @click="login()" class="flex justify-left items-center h-14 km-default">
            <div class="flex-1 ml-4">
                <div class="flex justify-center items-center">Login</div>
            </div>
            <div class="mr-4 image">&raquo;</div>
        </div>                    
    </div>    
</div>
</template>

<script>
import "@/assets/styles/tailwind.css"
export default {
    name: "Register",
    components: {},
    data: function() {
        return {};
    },
    mounted: function() {},
    methods: {
        login: function(type) {
            // to login stuff
            // e.g. show invalid 'toast'
        },
        show: function(page) {
            this.$router.replace(page)
        }
    },
	computed: {
	}
};
</script>

<style lang="scss" scoped>
.register {
    input {
        border: 1px solid lightgray;
        padding-left: 10px;
    }  
}
.km-btns {
    font-family: Arial;
    font-weight: 600;
    font-size: 19px;
    .km-default {
        width: 46%;
        background-color: #F12C2C;
        color: white;
        border-radius: 10px;
        .image {
           font-family: Roboto; 
           font-weight: 200;
           font-size: 34px;
           margin-top: -5px;
        }
    }
    .km-inv {
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