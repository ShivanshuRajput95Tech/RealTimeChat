import React, { useContext, useEffect } from 'react'
import assets, { imagesDummyData } from '../assets/assets'
import { ChatContext } from '../context/ChatContext'

const RightSidebar = () => {
  const {selectedUser, message} = useContext(ChatContext)
  const{logout,onlineUser} =useContext(AuthContext)
  const[msgImage,setMsgImage] = useState([])
//get all the image from the message and set them to state
useEffect(()=>{
  setMsgImage(message.filter((msg)=>msg.image).map((msg)=>msg.image))
})
  if (!selectedUser) return null

  return (
    <div
      className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-auto
      ${selectedUser ? "max-md:hidden" : ""}`}
    >

      {/* Profile */}
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">

        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-20 aspect-square rounded-full"
        />

        <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
          {onlineUsers.include(selectedUser._id) &&<span className="w-2 h-2 rounded-full bg-green-500"></span>}
          {selectedUser?.fullName}
        </h1>

        <p className="px-10 mx-auto text-center">
          {selectedUser?.bio}
        </p>

      </div>

      <hr className="border-[#ffffff50] my-4" />

      {/* Media */}
      <div className="px-5 text-xs">

        <p className="font-medium">Media</p>

        <div className="mt-2 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-4 opacity-80">

          {msgImage.map((url, index) => (
            <div
              key={index}
              onClick={() => window.open(url)}
              className="cursor-pointer rounded"
            >
              <img
                src={url}
                alt=""
                className="aspect-square object-cover rounded-md"
              />
            </div>
          ))}

        </div>

      </div>

      {/* Button */}
      <button
      onClick={()=> logout()}
        className="absolute bottom-5 left-1/2 -translate-x-1/2
        bg-gradient-to-r from-purple-500 to-violet-500
        text-white text-sm font-light px-20 py-2 rounded-full cursor-pointer"
      >
        Logout
      </button>

    </div>
  )
}

export default RightSidebar