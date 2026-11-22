import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Armchair, Globe2, ShieldCheck } from "lucide-react";
import { IMG } from "@/lib/images";

/** A considered photographic interlude between destinations and offers. */
export default function EditorialExperience() {
  return (
    <section className="aero-experience">
      <div className="container-x">
        <div className="aero-experience-heading">
          <div>
            <p className="aero-section-kicker"><span /> THE AEROVÉL EXPERIENCE</p>
            <h2>More than a flight.<br /><em>It&apos;s the way you feel.</em></h2>
          </div>
          <p>Thoughtful details, beautiful spaces, and a little more care — because the journey should be just as memorable as the destination.</p>
        </div>
        <div className="aero-experience-grid">
          <div className="aero-experience-image">
            <Image src={IMG.cabinEditorial} alt="A warm and spacious premium aircraft cabin" fill sizes="(max-width: 768px) 100vw, 65vw" className="object-cover" />
            <div className="aero-experience-image-label"><span>01 / THE JOURNEY</span><strong>A quieter kind of luxury.</strong></div>
          </div>
          <div className="aero-experience-aside">
            <div className="aero-experience-aside-image">
              <Image src="/images/places/plane-window.svg" alt="An airplane wing above clouds at sunset" fill sizes="(max-width: 768px) 50vw, 30vw" className="object-cover" />
              <span>THE VIEW FROM UP HERE</span>
            </div>
            <div className="aero-experience-aside-copy">
              <p className="aero-experience-quote">“It&apos;s not just where you go, but how you get there.”</p>
              <Link href="/about">DISCOVER OUR STORY <ArrowRight size={15} /></Link>
            </div>
          </div>
        </div>
        <div className="aero-experience-benefits">
          <div><Armchair size={19} /><span><strong>Exceptional comfort</strong><small>Considered at every touchpoint</small></span></div>
          <div><Globe2 size={19} /><span><strong>Extraordinary places</strong><small>Beautiful journeys, beautifully planned</small></span></div>
          <div><ShieldCheck size={19} /><span><strong>Travel with confidence</strong><small>A seamless booking experience</small></span></div>
        </div>
      </div>
    </section>
  );
}
