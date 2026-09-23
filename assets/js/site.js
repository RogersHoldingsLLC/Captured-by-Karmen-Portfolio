(() => {
  document.documentElement.classList.add("js");

  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector(".site-nav");

  if (menuButton && navigation) {
    const menuLabel = menuButton.querySelector(".sr-only");
    const setMenuOpen = (isOpen) => {
      menuButton.setAttribute("aria-expanded", String(isOpen));
      navigation.classList.toggle("is-open", isOpen);
      if (menuLabel) menuLabel.textContent = isOpen ? "Close navigation" : "Open navigation";
    };

    menuButton.addEventListener("click", () => {
      setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        menuButton.focus();
      }
    });
  }

  const year = document.querySelector("#current-year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
