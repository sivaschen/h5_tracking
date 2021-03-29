<template>
  <div class="mapDiv">
    <div id="mapContainer"></div>
    <div class="selectDevice">
      <p class="last" @click="lastDevice">^</p>
      <p class="next" @click="nextDevice">^</p>
    </div>
    <div class="info">
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
  </div>
</template>

<script>
import imgUrl from './../assets/car.png'

export default {
  data() {
    return {
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
      infowindow: null
    };
  },
  mounted(){
    this.map = new T.Map('mapContainer');
    this.map.centerAndZoom(new T.LngLat(113.280637, 23.125178), 16);
    //添加控件
    var ctrl = new T.Control.MapType();
    this.map.addControl(ctrl);

    this.map.addEventListener("moveend", this.MapMoveend);

    // this.getLocationData();

    //测试代码
    setInterval(()=>{
      this.getLocationData();
    }, 3000)
  },
  created(){    
    window.getDataCallback = this.getDataCallback.bind(this);    
    
  },
  beforeDestroy(){
    window.getDataCallback = null;
  },

  methods: {
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
      if(this.currentIndex) {
        this.currentIndex--
      } else {
        this.currentIndex = this.deviceList.length -1;
      };
      this.currentDevice = this.deviceList[this.currentIndex];
      this.getAddress()
      this.map.centerAndZoom(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat), this.zoom);
      this.currentMarker = this.markers[this.currentIndex];
      this.infowindow.closeInfoWindow();
      this.infowindow = this.currentMarker.infowindow;
      this.map.addOverLay(this.infowindow);
    },
    nextDevice(){
      if(this.currentIndex == (this.deviceList.length -1)) {
        this.currentIndex = 0;
      } else {
        this.currentIndex++;
      };
      this.currentDevice = this.deviceList[this.currentIndex];
      this.getAddress();
      this.map.centerAndZoom(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat), this.zoom);
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
    getDataCallback(data){
      let myData = JSON.parse(data)
      if(myData.errcode == 0 && myData.data.length>0) {
        this.deviceList = myData.data;
        let currentIMEI = this.currentDevice.imei
        if (currentIMEI == undefined && this.deviceList.length > 0) {
          this.currentDevice = this.deviceList[0];
          this.currentIndex = 0;
        }
        else {
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
          console.log(this.currentDevice);
          this.map.centerAndZoom(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat), this.zoom);
          this.addMarkers();
          this.firstLoad = false;
        } else {
          this.updateMarkers()
        }
      } else {
        console.error('获取数据失败')
      }
    },
    updateMarkers(){
      let deviceList = this.deviceList.slice(0);
      let obj = {};
      for (let j = 0; j < deviceList.length; j++) {
        obj[deviceList[j].imei] = deviceList[j];
      }
      for (let i = 0; i < this.markers.length; i++) {
        let marker = this.markers[i];
        let imei = marker.imei;
        console.log(imei)
        let lngLat = marker.getLngLat();
        if(lngLat.lat != obj[imei].lat || lngLat.lng != obj[imei].lng) {
          let lngLat = new T.LngLat(obj[imei].lng, obj[imei].lat)
          marker.setLngLat(lngLat);
          marker.infowindow.setLngLat(lngLat);
          if(marker.infowindow.isOpen()) {
            this.map.getBounds().contains(lngLat) || this.map.panTo(lngLat);
          }
        }

        let windowContent = marker.infowindow.getContent();
        if(windowContent != obj[imei].name){
          marker.infowindow.setContent(obj[imei].name);
        }
      }
    },
    getAddress(){
      const url = encodeURI("http://api.tianditu.gov.cn/geocoder?postStr={'lon': " +this.currentDevice.lng+ ",'lat':"+this.currentDevice.lat+",'ver':1}&type=geocode&tk=02c77be419309f75163b54b1d6109427")
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
    addMarkers(){        
      const _that = this;
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
        infoWin.setContent(String(item.name));
        //向地图上添加信息窗口
        
         //创建图片对象
        var icon = new T.Icon({
          iconUrl: imgUrl,
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
      }
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

</style>