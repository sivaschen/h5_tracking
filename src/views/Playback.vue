<template>
    <div id="playback">
        <div id="playbackMap"></div>
         <div class="info">
            <span class="name">{{deviceName}}</span>
            <hr>
            <span class="mileage">总里程：{{mileage}}km</span>
            <span class="speed">时速：{{currentSpeed}}km/h</span>
            <hr>
            <span class="time">时间：{{currentTime}}</span><br/>
            <span :class="[this.playState == 'play' ? 'icon-pause' : 'icon-play', 'iconfont', 'iconstyle']" @click="playAndPause"></span>
            <span class="progress">
                <span class="line"></span>
                <span class="circle" :style="{'left': circleLeft+'%'}"></span>
            </span>

        </div>
    </div>
</template>

<script>
import imgUrl from './../assets/car.png'
export default {
    data(){
        return {
            playState: "init",
            circleLeft: 0,
            deviceName: "",
            mileage: 0.00,
            currentSpeed: 0,
            currentTime: "2000-00-00 00:00:00",
            center: [113.280637, 23.125178],
            zoom: 11,
            imei: "",
            beginTime: "",
            endTime: "",
            lngLatArr: [],
            playInterval: 300,
            firstPointTime: "",
            progressScale: "",
            timer: null
        }
    },
    mounted(){
        this.map = new T.Map('playbackMap');
        this.map.centerAndZoom(new T.LngLat(113.280637, 23.125178), 11);
        //添加控件
        var ctrl = new T.Control.MapType();
        this.map.addControl(ctrl);
       
        setTimeout(this.getHistoryLocationData, 1000)    
        
    },
    created(){    
        let {imei, begintime, endtime } = this.$route.query;
        this.imei = imei;
        this.beginTime = begintime;
        this.endTime = endtime;
        window.historyCoordCallback = this.historyCoordCallback.bind(this);
    },
    beforeDestroy(){
        window.historyCoordCallback = null;
    },
    methods:{
        playAndPause() {
            console.log(this.playState)
            if(this.playState == "play"){
                clearTimeout(this.timer);
                this.playState = "pause";
            } else if (this.playState == "pause") {
                this.playState = "play"
                this.drawPath(this.index, 1);                
            } else if(this.playState == "complete") {
                this.map.clearOverLays();
                this.createMarker()
            }
        },
        getHistoryLocationData(){
            console.log('start');
            window.native.call(JSON.stringify({
                cmd: "historyCoord",
                param:{
                    begintime: this.beginTime,
                    endtime: this.endTime,
                    imei: this.imei
                },
                callback: "historyCoordCallback"
            })
            );
        },
        historyCoordCallback(res){
            let data = JSON.parse(res)
            console.log(res)
            if(data.errcode == 0) {
                this.lngLatArr = data.data.pos;
                this.createMarker();
            } else {
                console.error('获取数据失败');
                this.getHistoryLocationData();
            }
        },
        createMarker(){
            this.mileage = 0.00;
            this.progressScale = this.lngLatArr[this.lngLatArr.length -1].gps_time - this.lngLatArr[0].gps_time;
            this.deviceName = this.lngLatArr[0].name;
            this.currentSpeed = this.lngLatArr[0].speed;
            this.currentTime = this.timeFormat(this.lngLatArr[0].gps_time);            
            var lnglat = new T.LngLat(this.lngLatArr[0].lng, this.lngLatArr[0].lat);
            this.map.panTo(lnglat);
             //创建图片对象
            var icon = new T.Icon({
                iconUrl: imgUrl,
            });
            this.infoWin = new T.InfoWindow(String(this.lngLatArr[0].name),{offset: new T.Point(12,12)});
            this.infoWin.setLngLat(lnglat);
            //设置信息窗口要显示的内容
            this.marker = new T.Marker(lnglat, {icon:icon});
            this.map.addOverLay(this.marker);
            this.map.addOverLay(this.infoWin);
            this.polyline = new T.Polyline([lnglat, new T.LngLat(this.lngLatArr[1].lng, this.lngLatArr[1].lat)], {color:"rgb(3, 77, 19)"});
            
            this.playState = "play"
            this.drawPath(1);
        },
        drawPath(index, interval){
            if (index > (this.lngLatArr.length - 1)) {
                return
            }
            this.timer = setTimeout(()=> {
                let item = this.lngLatArr[index];
                this.currentSpeed = item.speed;
                this.index = index;
                let lngLat = new T.LngLat(item.lng, item.lat);
                //提前移动地图
                if(index < this.lngLatArr.length-1) {
                    let nextLngLat = new T.LngLat(this.lngLatArr[index+1].lng, this.lngLatArr[index+1].lat);
                    this.map.getBounds().contains(nextLngLat) || this.map.panTo(nextLngLat);
                }
                index == 1 && this.map.addOverLay(this.polyline);
                if(index >=1) {                    
                    let arr = this.polyline.getLngLats();
                    this.polyline.setLngLats(arr.concat(lngLat));
                    this.circleLeft = ((item.gps_time - this.lngLatArr[0].gps_time) / this.progressScale) * 100;
                    if(this.lngLatArr[index -1].lat == item.lat && this.lngLatArr[index -1].lng==item.lng) {
                        this.mileage = this.mileage;
                    } else {
                        
                        let distance = this.getFlatternDistance(this.lngLatArr[index -1].lat,this.lngLatArr[index -1].lng,item.lat,item.lng) / 1000;
                        this.mileage = this.mileage + distance;
                        let dotSeq = String(this.mileage).indexOf('.');                        
                        this.mileage = Number(String(this.mileage).substring(0,dotSeq+3));
                        this.currentTime = this.timeFormat(item.gps_time);
                    }
                }
                this.marker.setLngLat(lngLat);
                this.infoWin.setLngLat(lngLat)
                if (index == (this.lngLatArr.length -1)) {
                    this.playState = "complete";
                } else {
                    this.drawPath(++index);
                }
            }, interval || this.playInterval)
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
            .iconstyle {
                vertical-align: middle;
                font-size: 22px;
                margin-right: 12px;

            }
            .mileage {
                margin-right: 15px;
            }
            .progress {
                width: 80%;
                display: inline-block;
                position: relative;
                margin-top: 5px;
                .line {
                    display: inline-block;
                    background-color: rgb(182, 178, 178);
                    height: 3px;
                    line-height: 18px;
                    width: 100%;
                    vertical-align: middle;
                }
                .circle {
                    position: absolute;
                    width: 18px;                    
                    height: 18px;
                    border-radius: 50%;
                    transform: translateX(-9px);
                    line-height: 18px;
                    top: 0;
                    margin-top: 3px;
                    background-color: green;
                    vertical-align: middle;
                }
            }
        }
    }
    #playbackMap {
        width: 100%;
        height: 100%;
        color:rgb(3, 77, 19)
    }
</style>
