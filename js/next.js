var siteUrl = "https://www.youjizz.com/";
var imageUrl = 'https://cdne-pics.youjizz.com/';
var globalSort = "views";
var globalChannelId = undefined;
var globalPage = 1;

$(function () {
    ons.ready(function () {
        document.addEventListener('init', function (einit) {
            if (einit.target.id == 'page-home') {
                $.each(channels,function(index,channel){
                    $("<ons-carousel-item>").addClass("navibar-item").attr("data",channel.id).text((channel.name?channel.name:channel.id)).appendTo("#navibar");
                });
                $('.navibar-item').on('click', function (eclick) {
                    changeHomeNavi($(eclick.target));
                });
                $('#btn-sort').on('click', function (eclick) {
                    if(globalSort=='views'){
                        globalSort='recent';
                        $('#btn-sort ons-icon').attr("icon","fa-clock-o");
                        ons.notification.toast('按时间排列', { timeout: 2000 });
                    }else{
                        globalSort='views';
                        $('#btn-sort ons-icon').attr("icon","fa-sort-amount-desc");
                        ons.notification.toast('按人气排列', { timeout: 2000 });
                    }
                    $("#video-list ons-list-item").remove();
                    loadChannel(globalChannelId,globalSort,1,function(vos){
                        renderVos(vos,1);
                    });
                });
            }
        });
        document.addEventListener('show', function (einit) {
            if (einit.target.id == 'page-channel') {
                globalChannelId = einit.target.data.channelId;
                loadChannel(globalChannelId,globalSort,1,function(vos){
                    renderVos(vos,1);
                });
            } else if(einit.target.id == 'page-player'){
                console.log(einit.target.data.src)
                $("video").attr("src",einit.target.data.src);
                $("video").attr("autoplay","autoplay");
            }
        });
    });

});

function nextPage(eswipeup){
    if($(eswipeup.target).attr("page")==globalPage){
        loadChannel(globalChannelId,globalSort,globalPage+1,function(vos){
            renderVos(vos,globalPage+1);
            ons.notification.toast('继续加载 ' + vos.length + ' 个视频', { timeout: 1000 });
        });
    }
}

function renderVos(vos,page){
    if(page>1&&page<=globalPage) return;
    var gd = $("<ons-gesture-detector>").attr("page",globalPage);
    $.each(vos,function(i,vo){
        var li = $("<ons-list-item tappable longdivider link='"+vo.link+"'>").attr("page",globalPage);
        $("<div>").attr("page",globalPage).addClass("left").css("width","38%").html("<img src='"+vo.image+"' style='min-width:100%;max-width:100%;'>").appendTo(li);
        var vc = $("<div>").attr("page",globalPage).addClass("center").css("width","62%").html("<span style='position:absolute;top:12px;'>"+vo.title+"</span>").appendTo(li);
        $("<div>").attr("page",globalPage).css("position","absolute").css("bottom","12px").css("font-size","14px").css("right","12px").text("播放："+vo.views).appendTo(vc);
        $("<div>").attr("page",globalPage).css("position","absolute").css("bottom","30px").css("font-size","14px").css("right","12px").text(Math.round(parseFloat(vo.rating)*20)/10).appendTo(vc);
        $("<div>").attr("page",globalPage).css("position","absolute").css("bottom","12px").css("font-size","14px").text(vo.time).appendTo(vc);
        li.appendTo(gd);
        li.on("click",showPlaylist);
    });
    gd.appendTo("#video-list");
    gd.on("release",nextPage);
}

function showPlaylist(eclick){
    loadNews($(this).attr("link"),function(files){
        var obj={
            title: '选择播放源',
            cancelable: true,
            buttons: []
        };
        $.each(files,function(index,file){
            obj.buttons.push(file.name);
        });

        obj.buttons.push({
            label: '取消播放',
            modifier: 'destructive'
        });

        ons.openActionSheet(obj).then(function (index) { 
            if(index>-1){
                document.querySelector('#naviApp').pushPage('player.html', { data: { src: files[index].filename } });
            }
            
        })
    });
}

function changeHomeNavi(naviItem) {
    document.querySelector('#naviList').replacePage('channel.html', { data: { channelId: naviItem.attr('data') } });
    $('.navibar-item').removeClass('active');
    naviItem.addClass('active');
}

function loadChannel(channelId,sort,page,callback){
    globalPage = page;
    console.log("loadChannel");
    var url = "";
    if(sort=="views"){
        url = siteUrl+"/most-popular/";
    } else if(sort=="recent"){
        url = siteUrl+"/newest-clips/";
    }
    if(channelId){
        if(sort=="views"){
            url = siteUrl+"/search/views_"+channelId+"-";
        } else if(sort=="recent"){
            url = siteUrl+"/search/recent_"+channelId+"-";
        }
    }

    $.get(url+page+".html",function(dhtml){
        var vos = [];
        var d = $("<div>").css('display','none').html(dhtml);
        $('div.desktop-only div.video-item',d).each(function(index,video){
            var vo = {};
            vo.link = siteUrl+$('a.frame',video).first().attr('href');
            vo.title = $('div.video-title a',video).first().text();
            vo.image = imageUrl+$('a.frame img.lazy',video).first().attr('data-original').replace('//cdne-pics.youjizz.com','');
            vo.time = $('span.time',video).first().text();
            vo.rating = $('select.video-bar-rating-view',video).first().attr('data-value');
            vo.views = $('span.views',video).first().text();
            vos.push(vo);
        });
        d.remove();
        callback.call(null,vos);
    })

}

function loadNews(link,callback){
    var encodings = [];
    var files = [];
    $.get(link,function(dhtml){
        var d = $("<div>").css('display','none').html(dhtml);
        $('script',d).each(function(index,script){
            var t = $(script).text().trim();
            if(t.indexOf('\"filename\":')<0) return;
            t = t.substring(16,t.indexOf('\n')-1);
            encodings = eval(t);
            for(i=0;i<encodings.length;i++){
                if(encodings[i].filename.startsWith('//')){
                    encodings[i].filename="https:"+encodings[i].filename;
                }
                if(encodings[i].filename.indexOf("_hls")<0){
                    files.push(encodings[i]);
                }
            }
        });
        d.remove();
        callback.call(null,files);
    })
}