<template>
    <div v-html="require(path)"></div>
</template>

<script>
export default {
    props: ['path'],
    name: "SvgIcon"
}
</script>