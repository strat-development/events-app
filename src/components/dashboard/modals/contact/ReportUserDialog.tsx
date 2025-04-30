"use client"

import useWeb3forms from "@web3forms/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "../../../ui/use-toast";

import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../../../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { IconExclamationCircle } from "@tabler/icons-react";

interface UserReportProps {
    expanded?: (expanded: boolean) => void;
    userId: string;
}

export const UserReportDialog = ({ expanded, userId }: UserReportProps) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onTouched",
    });
    const [isSuccess, setIsSuccess] = useState(false);
    const [message, setMessage] = useState(false);
    const apiKey = process.env.PUBLIC_ACCESS_KEY || process.env.NEXT_PUBLIC_CONTACT_FORM_KEY || "";
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState<string>("");

    useEffect(() => {
        const message = ``;
        setValue("message", message);
    }, [reason, setValue]);

    const { submit: onSubmit } = useWeb3forms({
        access_key: apiKey,
        settings: {
            from_name: "Huddle. Reports",
            subject: "New user report Huddle.",
        },
        onSuccess: (msg, data) => {
            setIsSuccess(true);
            setMessage(Boolean(msg));
            reset();
            toast({
                title: "Message Sent",
                description: "We'll get back to you as soon as possible.",
            })
        },
        onError: (msg, data) => {
            setIsSuccess(false);
            setMessage(Boolean(msg));
            toast({
                title: "Message Failed",
                description: "Please try again later.",
                variant: "destructive"
            })
        },
    });

    return (
        <>
            <Dialog open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (expanded) expanded(false);
                }}>
                <DialogTrigger asChild>
                    <Button variant="ghost"
                        className="w-fit flex items-center mt-2 gap-2 cursor-pointer text-white/50"
                        onClick={() => setIsOpen(true)}>
                        Report User
                        <IconExclamationCircle size={20} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[425px] w-full flex flex-col items-center z-[999999999999999]">
                    <form className="p-4 w-full"
                        onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            type="checkbox"
                            id="botcheck"
                            className="hidden"
                            style={{ display: "none" }}
                            {...register("botcheck")}></Input>

                        <div className="mb-5">
                            <Input type="hidden"
                                defaultValue={userId}
                                {...register("group_id", {
                                    required: true,
                                })} />
                            {errors.name && (
                                <div className="mt-1 text-red-600">
                                    <small>{errors.name.message as any}</small>
                                </div>
                            )}
                        </div>

                        <div className="mb-5">
                            <label htmlFor="email_address" className="sr-only">
                                Email Address
                            </label>
                            <Input
                                id="email_address"
                                type="email"
                                placeholder="Email Address"
                                autoComplete="false"
                                className={`w-full px-4 py-3 outline-1 outline-white/10 placeholder:text-white/50 text-white/70 rounded-xl outline-none bg-transparent  ${errors.email
                                    ? "border-red-600 focus:border-red-600 ring-red-100 ring-0"
                                    : "border-white/10 ring-gray-100 focus:border-white/10 ring-0"
                                    } `}
                                {...register("email", {
                                    required: "Enter your email so we can respond to you",
                                    pattern: {
                                        value: /^\S+@\S+$/i,
                                        message: "Please enter a valid email",
                                    },
                                })}
                            />
                            {errors.email && (
                                <div className="mt-1 text-red-600">
                                    <small>{errors.email.message as any}</small>
                                </div>
                            )}
                        </div>

                        <div className="mb-5">
                            <Select
                                onValueChange={(value) => {
                                    setReason(value);
                                    setValue('reason', value, { shouldValidate: true });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select report reason" />
                                </SelectTrigger>
                                <SelectContent className="z-[99999999999]">
                                    <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                                    <SelectItem value="spam">Spam</SelectItem>
                                    <SelectItem value="scam">Scam</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.reason && (
                                <div className="mt-1 text-red-600">
                                    <small>{errors.reason.message as any}</small>
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <textarea
                                placeholder="Describe the issue"
                                className={`max-w-[400px] h-[300px] w-full px-4 py-3 outline-1 outline-white/10 placeholder:text-white/50 text-white/70 rounded-xl outline-none bg-transparent  ${errors.message
                                    ? "border-red-600 focus:border-red-600 ring-red-100 ring-0"
                                    : "border-white/10 ring-gray-100 focus:border-white/10 ring-0"
                                    } `}
                                {...register("message", {
                                    required: "Enter your Message",
                                })}
                            />
                            {errors.message && (
                                <div className="mt-1 text-red-600">
                                    <small>{errors.message.message as any}</small>
                                </div>
                            )}
                        </div>

                        <Button className="w-full"
                            type="submit">
                            {isSubmitting ? (
                                <svg
                                    className="w-5 h-5 mx-auto text-black animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                "Send Message"
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            
        </>
    )
}
