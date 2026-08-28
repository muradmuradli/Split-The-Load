const Footer = () => {
  return (
    <div className="border-t-4 border-b-slate-900 flex justify-center bg-amber-300 py-5">
      <div className="w-8/12 flex flex-col gap-2">
        <span className="text-lg font-bold">
          Because 'it's your turn' shouldn't start a fight.
        </span>
        <span className="text-sm font-medium">
          © {new Date().getFullYear()} Murad Muradli.
        </span>
      </div>
    </div>
  );
};

export default Footer;
