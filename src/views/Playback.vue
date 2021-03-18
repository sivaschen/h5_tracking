<template>
    <div id="playback">
        <div id="playbackMap"></div>
         <div class="info">
            <span class="name">{{deviceName}}</span>
            <hr>
            <span class="mileage">总里程：{{mileage}}km</span>
            <span class="speed">时速：{{currentSpeed}}km/h</span>
            <hr>
            <span class="time">时间：{{currentTime}}</span></br>
            <span class="play">Play</span>
            <span class="progress">
                <span class="line"></span>
                <span class="circle"></span>
            </span>

        </div>
    </div>
</template>

<script>
import imgUrl from './../assets/car.png'
export default {
    data(){
        return {
            deviceName: "",
            mileage: 0,
            currentSpeed: 0,
            currentTime: "2000-00-00 00:00:00",
            center: [113.280637, 23.125178],
            zoom: 11,
            imei: "",
            beginTime: "",
            endTime: "",
            lngLatArr: [],
            playInterval: 1000,
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
                    speed:3,
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
            this.deviceName = this.lngLatArr[0].name;
            this.currentSpeed = this.lngLatArr[0].speed;
            this.currentTime = this.timeFormat(this.lngLatArr[0].gps_time);            
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
            this.polyline = new T.Polyline([lnglat, new T.LngLat(this.lngLatArr[1].lng, this.lngLatArr[1].lat)], {color:"rgb(3, 77, 19)"});
            this.map.addOverLay(this.polyline);
            this.drawPath(1);
        },
        drawPath(index){
            if(index > (this.lngLatArr.length - 1)) {
                return
            }
            
            this.timer = setTimeout(()=> {
                let item = this.lngLatArr[index];
                this.currentSpeed = item.speed;
                this.index = index;
                let lngLat = new T.LngLat(item.lng, item.lat);
                if(index < this.lngLatArr.length-1) {
                    let nextLngLat = new T.LngLat(this.lngLatArr[index+1].lng, this.lngLatArr[index+1].lat);
                    this.map.getBounds().contains(nextLngLat) || this.map.panTo(nextLngLat);
                }

                if(index >1) {
                    let arr = this.polyline.getLngLats();
                    this.polyline.setLngLats(arr.concat(lngLat));
                    
                    this.mileage += Number((this.getFlatternDistance(this.lngLatArr[index -1].lat,this.lngLatArr[index -1].lng,item.lat,item.lng) / 1000).toFixed(2));
                    this.currentTime = this.timeFormat(item.gps_time);
                }

                this.marker.setLngLat(lngLat);
                this.infoWin.setLngLat(lngLat)
                this.drawPath(++index)
            }, this.playInterval)
        },
        getFlatternDistance (lat1, lng1, lat2, lng2) {
            const PI = Math.PI
            const EARTH_RADIUS = 6378137.0
            function getRad (d) {
                return d * PI / 180.0
            }
            let f = getRad((lat1 + lat2) / 2)
            let g = getRad((lat1 - lat2) / 2)
            let l = getRad((lng1 - lng2) / 2)
            let sg = Math.sin(g)
            let sl = Math.sin(l)
            let sf = Math.sin(f)

            let s, c, w, r, d, h1, h2
            let a = EARTH_RADIUS
            let fl = 1 / 298.257

            sg = sg * sg
            sl = sl * sl
            sf = sf * sf

            s = sg * (1 - sl) + (1 - sf) * sl
            c = (1 - sg) * (1 - sl) + sf * sl

            w = Math.atan(Math.sqrt(s / c))
            r = Math.sqrt(s * c) / w
            d = 2 * w * a
            h1 = (3 * r - 1) / 2 / c
            h2 = (3 * r + 1) / 2 / s

            return d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg))
        },
        doubleDigit(t){
            return t < 10 ? '0' + String(t) : t
        },
        timeFormat(time) {
            
            let t = new Date(time * 1000);
            let y = t.getFullYear();
            let m = this.doubleDigit(t.getMonth() + 1);
            let d = this.doubleDigit(t.getDate());
            let h = this.doubleDigit(t.getHours());
            let min = this.doubleDigit(t.getMinutes());
            let s = this.doubleDigit(t.getSeconds())
            return (y + '-'+m + '-' + d + ' ' + h + ':' + min + ":" + s)
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
            .mileage {
                margin-right: 15px;
            }
        }
    }
    #playbackMap {
        width: 100%;
        height: 100%;
        color:rgb(3, 77, 19)
    }
</style>
