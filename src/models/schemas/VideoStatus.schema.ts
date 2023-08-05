import { ObjectId } from 'mongodb'
import { EncodingStatus } from '~/constants/enum'

/* 
 *   Pending, // đang chờ ở hàng đợi (chưa đc encoding )
     Success, // encode xong và thành cong ...
     Processing, // đang encode
      Failed // encode that bại
 */
// model này quản lý trạng thái encoding cái HLS video
interface VideoStatusType {
  _id?: ObjectId
  name: string
  status: EncodingStatus
  message?: string
  created_at?: Date
  updated_at?: Date
}
export default class VideoStatus {
  _id?: ObjectId
  name: string // ten thu muc
  status: EncodingStatus
  message?: string
  created_at?: Date
  updated_at?: Date
  constructor({ name, status, message, _id, updated_at, created_at }: VideoStatusType) {
    this._id = new ObjectId()
    this.name = name
    this.status = status
    this.message = message || ''
    this.created_at = created_at || new Date()
    this.updated_at = updated_at || new Date()
  }
}
