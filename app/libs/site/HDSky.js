const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'HDSky';
    this.downloadLink = 'https://hdsky.me/download.php?id={ID}';
    this.url = 'https://hdsky.me/';
    this.id = 4;
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument('https://hdsky.me/', false, 10);
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b').innerHTML;
    // 上传
    info.upload = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[class=arrowup]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.trim();
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://hdsky.me/torrents.php?seeders=&incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.subtitle = (_torrent.querySelector('.torrentname > tbody > tr .embedded').lastChild.nodeValue || '').trim();
      if (torrent.subtitle === ']') {
        torrent.subtitle = (_torrent.querySelector('.torrentname > tbody > tr .embedded span[class=optiontag]:last-of-type') ||
          _torrent.querySelector('.torrentname > tbody > tr .embedded br')).nextSibling.nodeValue.trim().replace(/\[优惠剩余时间\uff1a/, '');
      }
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://hdsky.me/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.downloadLink = _torrent.querySelector('form[action*="download"]').action;
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('span[class*=optiontag]');
      for (const tag of tagsDom) {
        torrent.tags.push(tag.innerHTML.trim());
      }
      torrentList.push(torrent);
    }
    return {
      site: this.site,
      torrentList
    };
  };

  async getDownloadLink (link) {
    const document = await this._getDocument(link);
    const url = document.querySelector('form[title="下载种子"]').action;
    const downloadLink = url.startsWith('http') ? url : this.siteUrl + url;
    return downloadLink;
  }
};
module.exports = Site;