<template>
    <div id="playback">
        <tdt-map :center="center" :zoom="zoom"></tdt-map>
        <div class="operation">
            asdfasdf
        </div>
    </div>
</template>

<script>
export default {
    data(){
        return {
            center: [113.280637, 23.125178],
            zoom: 11
        }
    }
}
</script>

<style lang="less">
    #playback {
        height: 100%;
        width: 100%;
        position: relative;
        .operation {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 200px;
            z-index: 1001;
            background-color: #fff;
        }
    }
</style>
