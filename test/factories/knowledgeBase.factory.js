import { Factory } from 'rosie';

export default new Factory()
  .sequence('title', (i) => `How to register ${i}`)
  .attr('body', 'Lorem ipsum ruw adfkka dde')
  .attr('image', 'https://picsum.photos/200')
  .attr('tags', ['beginner', 'gallery']);
