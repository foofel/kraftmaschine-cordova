<template>
    <div class="fill-parent center-only">
        <div class="fill-parent content">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.center-only {
    > .content {
        margin: auto;
    } 
}
</style>