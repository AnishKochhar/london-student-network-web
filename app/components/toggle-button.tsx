export default function ToggleSwitch({ label, registerField }) {
    return (
        <label className="inline-flex items-center cursor-pointer mt-4">
            <span className="mr-2 text-sm">{label}</span>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    {...registerField}
                />
                <div
                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer
                        peer-checked:after:translate-x-5 peer-checked:bg-blue-600
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                        after:bg-white after:border-gray-300 after:border after:rounded-full
                        after:h-5 after:w-5 after:transition-all"
                />
            </div>
        </label>
    );
}
