var vm = require('vm');
var fs = require('fs');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var sync = require('synchronize');

var vows = require('vows');
var chai = require('chai');

// mock
var UrlFetchApp = require('./UrlFetchApp.js');
var ContentService = require('./ContentService.js');

// test codes
var GitHub_gs = fs.readFileSync('GitHub.gs', { encoding: 'utf-8' });
var Main_gs = fs.readFileSync('Main.gs', { encoding: 'utf-8' });
var XmlStringify_gs = fs.readFileSync('XmlStringify.gs', { encoding: 'utf-8' });

// test context
var context = {
  UrlFetchApp: UrlFetchApp,
  ContentService: ContentService
};

var code = [GitHub_gs, XmlStringify_gs, Main_gs].join('\n;');
vm.runInNewContext(code, context);

// run tests
var expect = chai.expect;

vows.describe('doGet').addBatch({
  'doGet (format: json)': {
    topic: function() {
      sync.fiber(function(){
        var res = context.doGet({ parameter: { format: 'json' }});
        res.content = JSON.parse(res.content);
        
        this.callback(null, res);
      }.bind(this));
    },
    
    'mimeType': function (res) {
      expect(res.mimeType).to.equal(ContentService.MimeType.JSON);
    },
    
    'have keys': function (res) {
      expect(res.content).to.have.keys(['version', 'downloadUrl', 'errMsg', 'isSucceeded']);
    },
    
    'version': function (res) {
      expect(res.content.version).to.not.be.empty;
    },
    
    'downloadUrl': function (res) {
      expect(res.content.downloadUrl).to.not.be.empty;
    },
    
    'isSucceeded': function (res) {
      expect(res.content.isSucceeded).to.be.true;
    },
    
    'errMsg': function (res) {
      expect(res.content.errMsg).to.be.null;
    }
  },
  
  'doGet (format: xml)': {
    topic: function() {
      sync.fiber(function(){
        var res = context.doGet({ parameter: { format: 'xml' }});
        res.doc = new dom().parseFromString(res.content);
        
        this.callback(null, res);
      }.bind(this));
    },
    
    'mimeType': function (res) {
      expect(res.mimeType).to.equal(ContentService.MimeType.XML);
    },
    
    'version': function (res) {
      var version = xpath.select('//version', res.doc);
      expect(version).to.have.length(1);
      expect(version[0].toString()).to.not.be.empty;
    },
    
    'downloadUrl': function (res) {
      var downloadUrl = xpath.select('//downloadUrl', res.doc);
      expect(downloadUrl).to.have.length(1);
      expect(downloadUrl[0].toString()).to.not.be.empty;
    },
    
    'errMsg': function (res) {
      var errMsg = xpath.select('//errMsg', res.doc);
      expect(errMsg).to.have.length(1);
      expect(errMsg[0].toString()).to.not.be.empty;
      expect(errMsg[0].childNodes[0].tagName).to.equal('null');
    },
    
    'isSucceeded': function (res) {
      var isSucceeded = xpath.select('//isSucceeded', res.doc);
      expect(isSucceeded).to.have.length(1);
      expect(isSucceeded[0].toString()).to.not.be.empty;
      expect(isSucceeded[0].childNodes[0].tagName).to.equal('true');
    }
  }
}).run();