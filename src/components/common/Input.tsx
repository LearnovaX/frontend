import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = {
  placeholder?: string;
  type: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className? :string;
  required?: boolean;
};

export default function Input({
  placeholder,
  type = "text",
  value,
  onChange,
  className,
  required,
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === "password";

  return (
    <div className="relative w-full">
      <input
        type={isPasswordField && isPasswordVisible ? "text" : type}
        placeholder={placeholder}
        value={value}
        className={`
          border border-gray-300
          hover:border-gray-400
          rounded-md
          px-5 py-4 w-full
          font-roboto
          font-light
          text-xl
          placeholder-gray-400
          placeholder:font-roboto
          placeholder:font-light
          placeholder:text-xl
          focus:shadow-glow
          focus:border-dark-blue
          focus:outline-none
          transition-all duration-300
          ${className}
        `}
        onChange={onChange}
        required={required}
      />
      {isPasswordField && (
        <button
          type="button"
          onClick={() => setIsPasswordVisible((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}
