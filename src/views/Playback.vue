<template>
    <div id="playback">
        <div id="playbackMap"></div>
         <div class="info">
            
            <hr>
           
        </div>
    </div>
</template>

<script>
export default {
    data(){
        return {
            center: [113.280637, 23.125178],
            zoom: 11,
            imei: "",
            beginTime: "",
            endTime: "",
            lngLatArr: []
        }
    },
    mounted(){
        this.map = new T.Map('playbackMap');
        this.map.centerAndZoom(new T.LngLat(113.280637, 23.125178), 11);
        //添加控件
        var ctrl = new T.Control.MapType();
        this.map.addControl(ctrl);
    },
    created(){    
        window.historyCoordCallback = this.historyCoordCallback.bind(this);
        // this.getHistoryLocationData()
    },
    beforeDestroy(){
        window.historyCoordCallback = null;
        // {
        // "success":true,
        // "errcode":0,
        // "msg":"OK",
        // "data":{
        // "pos":[
        // {
        // "lng":113.867562,
        // "lat":33.700943,
        // "gps_time":1614904909,
        // "course":0,
        // "speed":2,
        // "sysTime":1614904909,
        // "sequenceNo":11688
        // },
        // {
        // "lng":113.867562,
        // "lat":33.700945,
        // "gps_time":1614904910,
        // "course":0,
        // "speed":0,
        // "sysTime":1614904910,
        // "sequenceNo":11689
        // }
        // ]
        // }
        // }
    },
    methods:{
        getHistoryLocationData(){
            window.native.call(JSON.stringify({
                cmd: "historyCoord",
                param:{
                    begintime: 1614932778,
                    endtime: 1614952778,
                    imei: 668613900008888
                },
                callback: "historyCoordCallback"
            }));
        },
        historyCoordCallback(data){
            if(data.errcode == 0) {
                this.lngLatArr = this.lngLatArr.concat(data.data.pos);
                this.drawPath(data.data.pos);
            } else {
                console.error('获取数据失败');
                this.getHistoryLocationData();
            }
        },
        drawPath(arr){
            this.map.addControl()
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
        .info {
            position: absolute;
            bottom: 0px;
            height: 200px;
            background-color: #fff;
            width: 100%;
            z-index: 1001;
            border-radius: 15px 15px 0px 0px;
            padding: 20px;
            box-sizing: border-box;
            text-align: left;
        }
    }
    #playbackMap {
        width: 100%;
        height: 100%;
    }
</style>
