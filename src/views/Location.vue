<template>
  <div class="mapDiv">
    <div id="mapContainer"></div>
    <div class="selectDevice">
      <p class="last" @click="lastDevice">^</p>
      <p class="next" @click="nextDevice">^</p>
    </div>
    <div class="info">
      <div class="myLocationBtn" @click="toMyLocation">

      </div>
      <div class="statusInfo">
        <span :class="[ currentDevice.speed > 0 ? 'green' : 'blue' ]">{{currentDevice.speed > 0 ? "行驶" : "静止"}}</span>&nbsp;&nbsp;&nbsp;
        <span :class="[ currentDevice.speed > 0 ? 'timegreen' : 'time' ]">{{currentDevice.speed > 0 ? (String(currentDevice.speed) + "km/h") : " "}}</span>
        <span class="separator">|</span>
        <span class="locatingType">北斗GPS</span>
        <span class="toPlayback" @click="toPlayBack">回放</span>
        <span class="toDeviceDetail" @click="toDeviceDetail">详情</span>
      </div>
      <hr>
      <div class="nameAndAddress">
        <p class="name">{{currentDevice.name}}</p>
        <p class="address">{{address}}</p>
      </div>
    </div>
    <div id="permissionToast" v-if="showPermissionToast" @click="compassStartEvent" @touchend="touchEndEvent" @touchstart="touchStartEvent">开启指南针</div>
  </div>
</template>

<script>
import imgUrl from './../assets/car.png'
import compassImg from './../assets/compass.png'
import arrowImg from './../assets/arrow.png'
import pointImg from './../assets/point.png'
export default {
  data() {
    return {
      testData:{},
      address: "",
      firstLoad:true,
      center: [113.280637, 23.125178],
      zoom: 11,
      controls: [{name: "mapType"}],
      currentIndex: 0,
      deviceList: [],
      markers: [],
      icon: {
        iconUrl:imgUrl  
      },
      currentDevice: {},
      infowindow: null,
      myLocation: null,
      pdefinedOverlay: null,
      showPermissionToast:false,
      askPermission:false,
      permissonState: "unknown",
      loopMyLocation:false,
      markerOwnPosition: null
    };
  },
  mounted: async function(){  
    this.map = new T.Map('mapContainer');
    //添加控件
    var ctrl = new T.Control.MapType();
    this.map.addControl(ctrl);
    this.map.addEventListener("moveend", this.MapMoveend);
    
    //测试代码
    this.testData = {
        "success":true,
        "errcode":0,
        "msg":"OK",
        "data": {
          "imeis": [{
          "imei":"668613900008888",
            "lng":113.867562,
            "lat":33.700945,
            "gps_time":1614904910,
            "course":0,
            "speed":0,
          "name": "Constantinus",
          "remark": ""
        }, {
          "imei":"668613900007777",
            "lng":113.867562,
            "lat":33.720945,
            "gps_time":1614904910,
            "course":0,
            "speed":0,
          "name": "cosime",
          "remark": ""
        }],
          "my_location": {
            "lng":113.867562,
            "lat":33.700945,
            "gps_time":1614904910,
            "course":0,
            "speed":0,
          "heading": 0 //指南针方向
          }
                }
    }
   
    if(navigator.userAgent.indexOf('Safari') > -1 && window.DeviceOrientationEvent &&window.DeviceOrientationEvent.requestPermission) {
      window.DeviceOrientationEvent.requestPermission().then(state => {
        this.permissonState = state;
        this.askPermission = true;
        this.showPermissionToast = false;
        if(state == "granted") {
        } else if (state == "denied") {
          alert("请重启浏览器，如果使用指南针功能");
        }
      }).catch(err => {
        console.log(err);
        this.permissonState = "notPicked";
      }).finally(() => {
        // this.getLocationData();
        setInterval(()=>{
          this.testData.data.my_location.lng+=0.001;
          this.getDataCallback(this.testData);
        }, 2000)
      });
    } else {
      // this.getLocationData();
      setInterval(()=>{
        this.testData.data.my_location.lng+=0.001;
        this.getDataCallback(this.testData);
      }, 2000)
    }
   

 
  },
  created(){    
    /**
     * 
     */
    window.getDataCallback = this.getDataCallback.bind(this);    
    
  },
  beforeDestroy(){
    window.getDataCallback = null;
  },

  methods: {
    toMyLocation(){
      this.loopMyLocation = true;
      this.map.panTo(new T.LngLat(this.myLocation.lng, this.myLocation.lat))
    },
    touchStartEvent(){
      document.querySelector('#permissionToast').style.backgroundColor = "red";
    },
    touchEndEvent(){
      document.querySelector('#permissionToast').style.backgroundColor = "#aaa";
    },
    compassStartEvent(){
      this.showPermissionToast = false;
      const _that = this;
      if(window.DeviceOrientationEvent) {
        if(navigator.userAgent.indexOf('Android') == -1) {
          window.DeviceOrientationEvent.requestPermission().then(state => {
            _that.askPermission = true;
            _that.permissonState = state;
            if(state === "granted"){//允许
              console.error("用户允许",state);
              _that.drawMyLocation();
              }else if(state === "denied"){//拒绝
              _that.pdefinedOverlay.hideCompass();
                console.error("用户拒绝",state);
                alert("请重启浏览器，如果使用指南针功能");
            }else if(state === "prompt"){
                console.error("用户干了啥",state)
            }
          })
        }else {
        window.addEventListener('deviceorientation', function (evt) {
              let heading = compassHeading(evt.alpha, evt.beta,evt.gamma);
               _that.arrowDiv.style.transform = "rotate("+heading+"deg)"
              _that.compassDiv.style.transform = "rotate("+(360-heading)+"deg)"
              function compassHeading(alpha, beta, gamma) {
                // Convert degrees to radians
                var alphaRad = alpha * (Math.PI / 180);
                var betaRad = beta * (Math.PI / 180);
                var gammaRad = gamma * (Math.PI / 180);

                // Calculate equation components
                var cA = Math.cos(alphaRad);
                var sA = Math.sin(alphaRad);
                var cB = Math.cos(betaRad);
                var sB = Math.sin(betaRad);
                var cG = Math.cos(gammaRad);
                var sG = Math.sin(gammaRad);

                // Calculate A, B, C rotation components
                var rA = - cA * sG - sA * sB * cG;
                var rB = - sA * sG + cA * sB * cG;
                var rC = - cB * cG;

                // Calculate compass heading
                var compassHeading = Math.atan(rA / rB);

                // Convert from half unit circle to whole unit circle
                if(rB < 0) {
                  compassHeading += Math.PI;
                }else if(rA < 0) {
                  compassHeading += 2 * Math.PI;
                }

                // Convert radians to degrees
                compassHeading *= 180 / Math.PI;

                return compassHeading;

              }
        })
      }
       
      } 
    },
    MapMoveend(e) {
      this.zoom = this.map.getZoom();
    },
    toDeviceDetail() {
      window.native.call(JSON.stringify({
        cmd: "deviceDetail",
        param:{
          "imei": this.currentDevice.imei
        },
        callback: ""
        }));
    },
    toPlayBack(){
      window.native.call(JSON.stringify({
        cmd: "timeSelection",
        param: {
          "imei": String(this.currentDevice.imei)
        },
        callback: ""
      }))
      // this.$router.push({name:"Playback"})
    },
    lastDevice(){
      this.loopMyLocation = false;
      if(this.currentIndex) {
        this.currentIndex--
      } else {
        this.currentIndex = this.deviceList.length -1;
      };
      this.currentDevice = this.deviceList[this.currentIndex];
      this.getAddress()
      this.map.panTo(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat));
      this.currentMarker = this.markers[this.currentIndex];
      this.infowindow.closeInfoWindow();
      this.infowindow = this.currentMarker.infowindow;
      this.map.addOverLay(this.infowindow);
    },
    nextDevice(){
      this.loopMyLocation = false;
      if(this.currentIndex == (this.deviceList.length -1)) {
        this.currentIndex = 0;
      } else {
        this.currentIndex++;
      };
      this.currentDevice = this.deviceList[this.currentIndex];
      this.getAddress();
      this.map.panTo(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat));
      this.currentMarker = this.markers[this.currentIndex];
      this.infowindow.closeInfoWindow();
      this.infowindow = this.currentMarker.infowindow;
      this.map.addOverLay(this.infowindow);
    },
    getLocationData(){
      window.native.call(JSON.stringify({
        cmd: "getData",
        param:{
        },
        callback: "getDataCallback"
        }));
    },
    updateMylocation(){
      let point = new T.LngLat(this.myLocation.lng,this.myLocation.lat);
      this.pdefinedOverlay.setLnglatAndHeading(point, null);
    },
    drawMyLocation() {
      console.log(this.permissonState);
      const _that = this;
      var definedOverlay = T.Overlay.extend({
        initialize: function (lnglat,  options) {
            this.lnglat = lnglat;
            this.setOptions(options);
            this.heading = 0;
        },
        onAdd: function (map) {
          this.map = map;
          var div = this._div = document.createElement("div");
          div.style.position = "absolute";
          div.style.width = "150px";
          div.style.height = "150px";
          var compassDiv = this.compassDiv = document.createElement("div");
          compassDiv.style.background = "url(http://47.106.201.46/images/h5tracking/compass.png) no-repeat";
          compassDiv.style.backgroundSize = "100px 102px";
          compassDiv.style.backgroundPosition = "center center";
          compassDiv.style.position = "absolute";
          // compassDiv.style.display = "none";
          compassDiv.style.top = "24px";
          compassDiv.style.left = "24px";
          compassDiv.style.width = "102px";
          compassDiv.style.height = "102px";
          div.appendChild(compassDiv);

          var arrow = this.arrow = document.createElement("div");
          arrow.style.background = "url(http://47.106.201.46/images/h5tracking/arrow.png) no-repeat";
          arrow.style.position = "absolute";
          arrow.style.backgroundSize = "16px 42px";
          arrow.style.width = "16px";
          arrow.style.height = "42px";
          arrow.style.top = "54px";
          arrow.style.left = "67px";
          arrow.style.overflow = "hidden";
          div.appendChild(arrow);
          map.getPanes().overlayPane.appendChild(this._div);
          this.update();
      },

      onRemove: function () {
          var parent = this.div.parentNode;
          if (parent) {
              parent.removeChild(this.div);
              this.map = null;
              this.div = null;
          }
      },

      setLnglatAndHeading: function (lnglat, heading) {
        if(lnglat) {
          this.lnglat = lnglat;
          this.update();
        }
        if(heading) {
          this.heading = heading;
          this.updateHeading();
        }
      },
      getLnglat: function () {
          return this.lnglat;
      },
      setPos: function (pos) {
          this.lnglat = this.map.layerPointToLngLat(pos);
          this.update();
      },
      /**
       * 更新位置
       */
      update: function () {
        var pos = this.map.lngLatToLayerPoint(this.lnglat);
        this._div.style.top = (pos.y -75) + "px";
        this._div.style.left = (pos.x - 75) + "px";
      },
      updateHeading: function () {
        this.arrow.style.transform = "rotate("+this.heading+"deg)"
        this.compassDiv.style.transform = "rotate("+(360-this.heading)+"deg)"
      },
      hideCompass:function () {
        this.compassDiv.style.display = "none";
      },
      showCompass:function () {
        this.compassDiv.style.display = "block";
      }        
    });
      //向地图上添加标注
      if(this.permissonState == "granted") {
        var point = new T.LngLat(this.myLocation.lng, this.myLocation.lat);
        this.pdefinedOverlay = new definedOverlay(point, {});
        this.map.addOverLay(this.pdefinedOverlay);
        this.pdefinedOverlay.showCompass();
       //创建标注对象
            //向地图上添加标注
        window.addEventListener('deviceorientation', function (evt) {
          _that.pdefinedOverlay.setLnglatAndHeading(null, evt.webkitCompassHeading)
        })
      }
    },
    getDataCallback(data){
      // let myData = JSON.parse(data)
      let myData = data;    
      this.myLocation = myData.data.my_location;

      if(myData.errcode == 0 && myData.data.imeis.length>0) {
        this.deviceList = myData.data.imeis;
        let currentIMEI = this.currentDevice.imei;
        if (currentIMEI == undefined && this.deviceList.length > 0) {
          this.currentDevice = this.deviceList[0];
          this.currentIndex = 0;
        } else {
          for (let index = 0; index < this.deviceList.length; index++) {
            const element = this.deviceList[index];
            if (currentIMEI == element.imei) {
              this.currentDevice = element
              this.currentIndex = index;
              break;
            }
          }
        }
        this.getAddress();
        if(this.firstLoad){
          console.log("firstload");
          this.map.centerAndZoom(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat), this.zoom);
          this.addMarkers();
          this.firstLoad = false;
          if(this.permissonState == "granted") {
            this.drawMyLocation();
          } else if (this.permissonState == "notPicked") {
            this.showPermissionToast =true;
          }
        } else {
          this.updateMarkers()
        }
      } else {
        console.error('获取数据失败')
      }
    },
    updateMarkers(){
      this.markerOwnPosition.setLngLat(new T.LngLat(this.myLocation.lng,this.myLocation.lat));
      if(this.pdefinedOverlay) {
        this.updateMylocation();
      };
      let points = [];
        points.push(new T.LngLat(this.myLocation.lng, this.myLocation.lat));
        points.push(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat));
      this.myLocationLine.setLngLats(points)
      let deviceList = this.deviceList.slice(0);
      let obj = {};
      for (let j = 0; j < deviceList.length; j++) {
        obj[deviceList[j].imei] = deviceList[j];
      }
      if(this.loopMyLocation) {
        let myLngLat = new T.LngLat(this.myLocation.lng, this.myLocation.lat);
        this.map.getBounds().contains(myLngLat) || this.map.panTo(myLngLat);
      }
      for (let i = 0; i < this.markers.length; i++) {
        let marker = this.markers[i];
        let imei = marker.imei;
        let lngLat = marker.getLngLat();
        if(lngLat.lat != obj[imei].lat || lngLat.lng != obj[imei].lng) {
          let lngLat = new T.LngLat(obj[imei].lng, obj[imei].lat)
          marker.setLngLat(lngLat);
          marker.infowindow.setLngLat(lngLat);
          if(marker.infowindow.isOpen() && !this.loopMyLocation) {
            this.map.getBounds().contains(lngLat) || this.map.panTo(lngLat);
          }
        }
        let markerContent = obj[imei].name + " 距离：" + this.getMyLocationDistance(this.myLocation.lat,this.myLocation.lng,obj[imei].lat,obj[imei].lng) + "km";
        marker.infowindow.setContent(markerContent);
      }
    },
    getAddress(){
      const url = encodeURI("https://api.tianditu.gov.cn/geocoder?postStr={'lon': " +this.currentDevice.lng+ ",'lat':"+this.currentDevice.lat+",'ver':1}&type=geocode&tk=02c77be419309f75163b54b1d6109427")
      this.$axios({
        method: 'get',
        url})
      .then((response) => {
        this.address = response.data.result.formatted_address
      })
      .catch(function (error) {
        console.log(error);
      });
    },
    getMyLocationDistance (lat1, lng1, lat2, lng2) {
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

      return (d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg)) / 1000).toFixed(2)
  },
    addMarkers(){        
      const _that = this;
      var iconOwnPosition = new T.Icon({
          iconUrl: pointImg,
          iconSize: new T.Point(19, 19),
          iconAnchor: new T.Point(10, 10)
      });
      //向地图上添加自定义标注
      this.markerOwnPosition = new T.Marker(new T.LngLat(this.myLocation.lng, this.myLocation.lat), {icon: iconOwnPosition});
      this.map.addOverLay(this.markerOwnPosition);
      for (let i = 0; i < this.deviceList.length; i++) {
        let item = this.deviceList[i];
        var lnglat = new T.LngLat(item.lng, item.lat);
        //创建信息窗口对象
         //创建信息窗口对象
        let point = new T.Point(12,12)
        var infoWin = new T.InfoWindow();
        infoWin.setOffset(point);
        infoWin.setLngLat(lnglat);
        //设置信息窗口要显示的内容
        let markerContent = String(item.name)+" 距离："+this.getMyLocationDistance(this.myLocation.lat,this.myLocation.lng,this.currentDevice.lat,this.currentDevice.lng) + "km";
        infoWin.setContent(markerContent);
        //向地图上添加信息窗口
       
         //创建图片对象
        var icon = new T.Icon({
          iconUrl: imgUrl,
          iconSize: new T.Point(26, 26),
          iconAnchor: new T.Point(13, 13)
        });
        //创建标注对象
        var marker = new T.Marker(lnglat, {icon:icon});
        this.markers.push(marker);
        marker.infowindow = infoWin;
        marker.index = i;
        marker.imei = item.imei;
        if(i == 0) {
          this.map.addOverLay(infoWin);
          this.infowindow = infoWin;
        }
        marker.addEventListener("click", function () {
          _that.currentMarker = this;
          let info = this.infowindow;
          _that.infowindow.closeInfoWindow();
          _that.infowindow = info;
          _that.map.addOverLay(info);
          _that.currentDevice = _that.deviceList[this.index];
          _that.getAddress()
        });
        //向地图上添加标注
        this.map.addOverLay(marker);
      };
       //线
        let points = [];
        points.push(new T.LngLat(this.myLocation.lng, this.myLocation.lat));
        points.push(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat));
            //创建线对象
        this.myLocationLine = new T.Polyline(points);
        this.map.addOverLay(this.myLocationLine);
    },
    openInfowidow({ target, extData }) {
      this.infowindow = {
        target,
        content: `<span>${extData}</span>`
      };
    }
  }
};
</script>

<style scoped lang="less">
.mapDiv {
  width: 100%;
  height: 100%;
  position: relative;
  .tdt-control-copyright {
    visibility: hidden;
  }
}
#mapContainer {
  height: 100%;
  width: 100%;
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
  .myLocationBtn {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    box-shadow: 0 0 5px rgb(0 0 0 / 20%);
    -webkit-box-shadow: 0 0 5px rgb(0 0 0 / 20%);
    -moz-box-shadow: 0 0 5px rgba(0,0,0,.2);
    background: #fff url("./../assets/map_icon.png") no-repeat 6px -245px;
    background-size: 48px 329px;
    position: absolute;
    top: -50px;
    right: 20px;
  }
  .statusInfo {
    margin-top: 15px;
    .blue {
      color: skyblue;
    }
    .green {
      color: green;
    }
    .time {
      color: skyblue;
      margin-left: 10px;
     
    }
     .timegreen {
        color: green;
        margin-left: 10px;
      }
    .separator {
      margin-right: 10px;
      margin-left: 10px;
    }
    .toDeviceDetail {
      margin-right: 10px;
      float: right;
      color: rgb(44, 117, 167);
    }
    .toPlayback {
      float: right;
      color: rgb(44, 117, 167);
    }
  }
  .nameAndAddress {
    margin-top: 15px;
    p {
      margin: 0;
      padding: 0;
    }
    .name {
      color: black;
      font-size:20px;
    }
    .address {
      margin-top: 3px;
    }
  }
}
  .selectDevice {
    position: absolute;
    top: 40%;
    right: 10px;
    z-index: 1001;
    height: 70px;
    width: 30px;
    p {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #fff;
      margin: 0px;
      font-size: 22px;
        line-height: 40px;
      &.next {
        margin-top: 10px;
        transform: rotateX(180deg);
      }
    }
  }
  #permissionToast {
    position: absolute;
    left: 50%;
    top: 30%;
    transform: translate(-50%,-50%);
    width: 70%;
    height: 60px;
    line-height: 60px;
    background-color: #aaa;
    opacity: 0.8;
    border-radius: 50px;
    z-index: 999;

  }

</style>