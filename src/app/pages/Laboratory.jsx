import React, { useState } from "react";
import {
  ArrowLeft,
  FlaskConical,
  Zap,
  Gem,
  Leaf,
  Sparkles,
  ChevronRight,
  Microscope,
} from "lucide-react";
import "./Laboratory.css";

const SECTIONS = [
  {
    id: "boosts",
    title: "Посилення",
    description: "Дослідження та постійне покращення героя",
    icon: Zap,
    color: "#e8a23b",
  },
  {
    id: "elixirs",
    title: "Еліксири",
    description: "Створення магічних напоїв та бойових сумішей",
    icon: FlaskConical,
    color: "#a879d8",
  },
  {
    id: "stone",
    title: "Камінь",
    description: "Таємниці магічних каменів та їхні властивості",
    icon: Gem,
    color: "#65a9c9",
  },
  {
    id: "herb",
    title: "Трава",
    description: "Рідкісні рослини та алхімічні інгредієнти",
    icon: Leaf,
    color: "#76ad65",
  },
];

function LaboratorySection({ section, onBack }) {
  const Icon = section.icon;

  return (
    <div className="lab-inner-page">
      <button className="lab-back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        До лабораторії
      </button>

      <div className="lab-inner-header">
        <div
          className="lab-inner-icon"
          style={{ "--section-color": section.color }}
        >
          <Icon size={34} />
        </div>

        <div>
          <span className="lab-eyebrow">ЛАБОРАТОРІЯ</span>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>
      </div>

      <div className="lab-coming-soon">
        <Sparkles size={32} />
        <h3>Розділ готується</h3>
        <p>
          Незабаром тут з'являться можливості розділу
          «{section.title}».
        </p>
      </div>
    </div>
  );
}

export default function Laboratory({ onNavigate }) {
  const [section, setSection] = useState("home");

  const returnToLaboratory = () => {
    setSection("home");
  };

  const selectedSection = SECTIONS.find(
    (item) => item.id === section
  );

  return (
    <main className="laboratory-page">
      <div className="laboratory-container">
        <header className="laboratory-header">
          <button
            className="laboratory-back"
            onClick={() =>
              section !== "home"
                ? returnToLaboratory()
                : onNavigate?.("home")
            }
            aria-label="Назад"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <span className="lab-eyebrow">МАЙСТЕРНЯ ЗНАНЬ</span>
            <h1>Лабораторія</h1>
            <p>Відкривай нові можливості свого героя</p>
          </div>

          <div className="laboratory-header-icon">
            <Microscope size={25} />
          </div>
        </header>

        {selectedSection ? (
          <LaboratorySection
            section={selectedSection}
            onBack={returnToLaboratory}
          />
        ) : (
          <>
            <section className="lab-intro">
              <div className="lab-intro-icon">
                <FlaskConical size={30} />
              </div>

              <div>
                <h2>Таємниці знань</h2>
                <p>
                  Досліджуй стародавні знання, створюй
                  магічні речовини та посилюй свого героя.
                </p>
              </div>
            </section>

            <div className="lab-section-heading">
              <div>
                <h2>Розділи лабораторії</h2>
                <p>Обери напрям досліджень</p>
              </div>
              <Sparkles size={21} />
            </div>

            <div className="lab-sections-grid">
              {SECTIONS.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    className="lab-section-card"
                    onClick={() => setSection(item.id)}
                    style={{ "--section-color": item.color }}
                  >
                    <div className="lab-card-icon">
                      <Icon size={29} />
                    </div>

                    <div className="lab-card-content">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>

                    <ChevronRight
                      className="lab-card-arrow"
                      size={21}
                    />
                  </button>
                );
              })}
            </div>

            <footer className="laboratory-footer">
              <Sparkles size={16} />
              Знання — найсильніша зброя героя
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
