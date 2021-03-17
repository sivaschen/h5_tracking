<template>
    <div id="playback">
        <div id="playbackMap"></div>
         <div class="info">
            
            <hr>
           
        </div>
    </div>
</template>

<script>
import imgUrl from './../assets/car.png'
export default {
    data(){
        return {
            center: [113.280637, 23.125178],
            zoom: 11,
            imei: "",
            beginTime: "",
            endTime: "",
            lngLatArr: [],
            playInterval: 3000,
            testData: [
                {
                    imei:"668613099991111",
                    lng:113.303037,
                    lat:23.125178,
                    name:"share001",
                    speed:0,
                    gps_time:1614904910,
                    course:0 
                    },{
                    imei:"668613099991112",
                    lng:113.410037,
                    lat:23.125178,
                    name:"share002",
                    speed:1,
                    gps_time:1614904920,
                    course:0 
                    },{
                    imei:"668613099991113",
                    lng:113.520037,
                    lat:23.125178,
                    name:"share003",
                    speed:0,
                    gps_time:1614905910,
                    course:0 
                    },{
                    imei:"668613099991114",
                    lng:113.631037,
                    lat:23.125178,
                    name:"share004",
                    speed:2,
                    gps_time:1614924910,
                    course:0 
                }
            ]
        }
    },
    mounted(){
        this.map = new T.Map('playbackMap');
        this.map.centerAndZoom(new T.LngLat(113.280637, 23.125178), 11);
        //添加控件
        var ctrl = new T.Control.MapType();
        this.map.addControl(ctrl);
        let data = {
            errcode: 0,
            data: {pos: this.testData}
        }
        this.historyCoordCallback(data)
    },
    created(){    
        let {imei, begintime, endtime } = this.$route.query;
        this.imei = imei;
        this.beginTime = begintime;
        this.endTime = endtime;
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
                    begintime: this.beginTime,
                    endtime: this.endTime,
                    imei: this.imei
                },
                callback: "historyCoordCallback"
            }));
        },
        historyCoordCallback(data){
            if(data.errcode == 0) {
                this.lngLatArr = data.data.pos;
                this.createMarker();
            } else {
                console.error('获取数据失败');
                this.getHistoryLocationData();
            }
        },
        createMarker(){
            var lnglat = new T.LngLat(this.lngLatArr[0].lng, this.lngLatArr[0].lat);
             //创建图片对象
            var icon = new T.Icon({
                iconUrl: imgUrl,
            });
            this.infoWin = new T.InfoWindow();
            this.infoWin.setLngLat(lnglat);
            //设置信息窗口要显示的内容
            this.infoWin.setContent(String(this.lngLatArr[0].name));
            this.marker = new T.Marker(lnglat, {icon:icon});
            this.map.addOverLay(this.marker);
            this.map.addOverLay(this.infoWin);
            this.polyline = new T.Polyline([lnglat, new T.LngLat(this.lngLatArr[1].lng, this.lngLatArr[1].lat)]);
            this.map.addOverLay(this.polyline);
            this.drawPath(1);
        },
        drawPath(index){
            if(index > (this.lngLatArr.length - 1)) {
                return
            }
            
            this.timer = setTimeout(()=> {
                let item = this.lngLatArr[index];
                this.index = index;
                let lngLat = new T.LngLat(item.lng, item.lat);
                if(index >1) {
                    let arr = this.polyline.getLngLats();
                    console.log(this.polyline.getColor())
                    this.polyline.setLngLats(arr.concat(lngLat))
                    
                }

                this.marker.setLngLat(lngLat);
                this.infoWin.setLngLat(lngLat)
                this.drawPath(++index)
            }, this.playInterval)
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
