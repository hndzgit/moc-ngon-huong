import { assetUrl } from '../lib/assets';
import React from 'react';
import { PageRoute } from '../types';

interface StoryPageProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const StoryPage: React.FC<StoryPageProps> = () => {
  return (
    <div className="story-page bg-[#faf8f3]">
      {/* 1. Full-Bleed Story Hero Banner (Figma 33:2786) */}
      <section className="relative w-full h-[460px] sm:h-[580px] lg:h-[680px] overflow-hidden bg-[#203323]">
        <img
          src={assetUrl("/assets/figma/story-hero.png")}
          alt="Câu chuyện thương hiệu Mộc Ngôn Hương"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <img src={assetUrl("/assets/figma/originals/90128.png")} alt="" aria-hidden="true" className="story-hero-shade absolute inset-0 w-full h-full rotate-180" />
        <div className="relative z-10 figma-container h-full flex flex-col items-center justify-end text-center pb-12 sm:pb-16 px-4">
          <h1 className="font-philosopher font-bold text-[38px] sm:text-[54px] lg:text-[68px] text-[#f7f4d5] leading-[1.1] mb-3 drop-shadow-md">
            Mộc Ngôn Hương
          </h1>
          <p className="text-[15px] sm:text-[18px] md:text-[20px] leading-[28px] text-[#f7f4d5]/95 max-w-[920px]">
            Mộc gợi sự tự nhiên và trà Việt; Ngôn là lời muốn nói; Hương là trải nghiệm cảm xúc thông qua trà.
          </p>
        </div>
      </section>

      {/* 2. Section 1: "Một Mong Muốn Giản Dị" + Large Open Box Photo */}
      <section className="py-12 md:py-16">
        <div className="figma-container max-w-[1380px] mx-auto text-center">
          <h2 className="font-philosopher font-bold text-[26px] sm:text-[32px] lg:text-[36px] text-[#203323] mb-4">
            Một Mong Muốn Giản Dị
          </h2>
          <p className="text-[14px] md:text-[15.5px] leading-[25px] text-[#555555] max-w-[1160px] mx-auto mb-8">
            Mộc Ngôn Hương bắt đầu từ một mong muốn giản dị: biến trà – một thức quà quen thuộc – thành một cách để mọi người dễ dàng gửi gắm tình cảm đến những người mình trân trọng. Chúng tôi lựa chọn trà làm nền tảng bởi trà mang sự mộc mạc, tinh tế và gần gũi, rồi kết hợp cùng những hương hoa quen thuộc để tạo nên những sắc thái cảm xúc khác nhau. Với Mộc Ngôn Hương, mỗi hương trà không chỉ được tạo ra để thưởng thức mà còn để gợi lên một điều muốn nói, một cảm xúc muốn trao. Vì vậy, chúng tôi tin rằng một món quà ý nghĩa không nhất thiết phải lớn lao, chỉ cần được lựa chọn bằng sự chân thành. Mộc Ngôn Hương – Chọn hương, gửi lời thương.
          </p>

          <div className="rounded-[18px] overflow-hidden shadow-md">
            <img
              src={assetUrl("/assets/figma/story-1.png")}
              alt="Một Mong Muốn Giản Dị — Hộp trà Mộc Ngôn Hương"
              className="w-full max-h-[720px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* 3. Section 2: "Gửi Gắm Những Điều Khó Nói" + Large Outdoor Tea Tray Photo */}
      <section className="pb-16 md:pb-24 pt-4">
        <div className="figma-container max-w-[1380px] mx-auto text-center">
          <h2 className="font-philosopher font-bold text-[26px] sm:text-[32px] lg:text-[36px] text-[#203323] mb-4">
            Gửi Gắm Những Điều Khó Nói
          </h2>
          <p className="text-[14px] md:text-[15.5px] leading-[25px] text-[#555555] max-w-[1160px] mx-auto mb-8">
            Mộc Ngôn Hương ra đời từ mong muốn giúp mọi người dễ dàng gửi gắm những điều khó nói qua một món quà ý nghĩa. Chúng tôi mong khách hàng sau khi trải nghiệm không chỉ cảm nhận được chất lượng của trà mà còn thấy mình đã chọn đúng một hương trà để thay lời muốn nói – Cốm là Yên, Nhài là Thương, Bưởi là An, Hoa Sói là Nhớ. Nếu Mộc Ngôn Hương là một con người, đó sẽ là một người trầm ấm, mộc mạc, tinh tế và chân thành, thể hiện sự quan tâm một cách nhẹ nhàng. Điểm khác biệt của thương hiệu không nằm ở việc tạo ra một loại trà mới, mà ở cách kết nối hương trà với cảm xúc và biến trà thành một món quà mang thông điệp. Bên cạnh trải nghiệm, Mộc Ngôn Hương chú trọng lựa chọn trà Thái Nguyên và kiểm soát chất lượng từ nguồn nguyên liệu đến thành phẩm, để mỗi món quà vừa có ý nghĩa về cảm xúc vừa đảm bảo giá trị thực. Hãy chọn điều bạn muốn gửi, Mộc Ngôn Hương sẽ giúp bạn tìm một hương trà để nói thay.
          </p>

          <div className="rounded-[18px] overflow-hidden shadow-md">
            <img
              src={assetUrl("/assets/figma/story-2.png")}
              alt="Gửi Gắm Những Điều Khó Nói — Khay trà Mộc Ngôn Hương"
              className="w-full max-h-[720px] object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
