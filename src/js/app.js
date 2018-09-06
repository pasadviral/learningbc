App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    /*
     * Replace me...
     */
    
    if (typeof web3 !== 'undefined') {
      //instance from meta Mask maybe?
      App.web3Provider = web3.currentProvider;
    } else {
      //default
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    /*
     * Replace me...
     */
    $.getJSON("Election.json", function(election){
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);
      return App.render();
    });
  },

  render: function(){
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    
    loader.show();
    content.hide();

    //account data
    web3.eth.getCoinbase( function(err, account) {
      if(err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    //load contract data
    App.contracts.Election.deployed().then( function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then( function(candidatesCount) {
      var candidatesResult = $("#candidatesResults");
      candidatesResult.empty();

      var candidatesSelect = $("#candidatesSelect");
      candidatesSelect.empty();

      for ( var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then( function (candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
          candidatesResult.append(candidateTemplate);

          var candidateOption = "<option value='" + id + "'>" + name + "</option>"
          candidatesSelect.append(candidateOption);
          
        });
      }

      return electionInstance.voters(App.account);
    }).then(function(hasVoted){
      console.log("dekho wo aagaya", hasVoted);
      if(hasVoted){
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch( function (error) {
      console.warn(error);
    });
  },


castVote: function(){
  var candidateId = $('#candidatesSelect').val();
  App.contracts.Election.deployed().then(function(instance){
    return instance.vote(candidateId, {from: App.account});
  }).then(function(result){
    $("#content").hide();
    $("#loader").show();
  }).catch(function(err){
    console.error(err);
  });
},
}

$(function() {
  $(window).load(function() {
    App.init();
  });
});
