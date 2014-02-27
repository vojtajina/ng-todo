var items = [
  {text: 'Try AngularJS', done: false},
  {text: 'Visit Nantes', done: false}
];

$(document).ready(function() {
  var list = $('#items');

  // render initial items
  items.forEach(function(item) {
    list.append('<li>' + item.text + '</li>');
  });

  // event listener, when user clicks the button
  $('#addButton').click(function(event) {
    var text = $('#newItem').val();

    items.push({text: text, done: false});
    list.append('<li>' + text + '</li>');

    $('#newItem').val('');
    event.preventDefault();
  });
});
