import { Factory } from 'rosie';

export default new Factory()
  .attr('title', 'How to register')
  .attr('author', 'John Doe')
  .attr('body', 'Lorem ipsum ruw adfkka dde')
  .sequence('readLength', (i) => i)
  .attr('image', 'https://picsum.photos/200')
  .attr('tags', ['beginner', 'gallery']);
