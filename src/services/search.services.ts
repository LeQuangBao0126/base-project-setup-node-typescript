import { SearchQuery } from '~/models/requests/Search.request'
import databaseService from './database.services'

class SearchServices {
  async search(query: SearchQuery) {
    console.log(query.content)
    const filter = {
      $text: { $search: 'ban' }
    }
    const rs = await databaseService.tweets.find(filter).skip(0).limit(100).toArray()

    return { message: 'tinh năng đang fixxxx', rs }
  }
}
const searchServices = new SearchServices()
export default searchServices
