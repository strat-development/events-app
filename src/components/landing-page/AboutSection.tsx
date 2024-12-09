import Image from "next/image"
import { ContactDialog } from "../ContactDialog"

export const AboutSection = () => {
    return (
        <>
            <div className="max-w-[1200px] w-full px-4 flex flex-col gap-8 min-[768px]:h-screen">
                <div>
                    <h2 className="text-white/50">About</h2>
                    <hr className="h-[1px]" />
                </div>
                <div className="flex flex-col-reverse gap-16 min-[768px]:flex-row">
                    <div className="flex flex-col gap-8">
                        <h2 className="text-4xl text-white/70 w-[80%]">Life changes born new ideas</h2>
                        <p className="font-thin text-white/50">
                            Project idea came to me after I moved to Gdańsk and I was forced to find new people that share my interests. 
                            The main goal of the project is to help people find others with similar interests and create groups that would allow them to meet in real life. 
                            The project is still in development and I am constantly working on new features and improvements. 
                            I hope that you will find the platform useful and that it will help you find new friends. 
                            If you have any suggestions or ideas for improvements, feel free to contact me. 
                            I will be happy to hear from you. <br /> <br />
                            
                            Enjoy! 😊
                        </p>
                        <ContactDialog />
                    </div>
                    <Image className="rounded-md border border-white/10 shadow-xl shadow-white/5 min-[900px]:w-[40%]"
                        src="/about-image.png" alt="About section image" width={2000} height={2000} />

                </div>
            </div>
        </>
    )
}